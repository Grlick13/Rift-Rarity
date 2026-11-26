import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Flame,
  HelpCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  AnswerPickCounts,
  GameMode,
  GameScreen,
  QuestionCategory,
  RankId,
  RiftData,
  RoundResult,
  TriviaQuestion,
  ValidAnswerEntry,
} from './types/game';
import { loadRiftData } from './services/ddragon';
import { buildQuestionPool, getTodayUtcKey, selectRunQuestions } from './data/questions';
import { RANKS, computeRoundPoints, isDiamondOrBetter } from './data/ranks';
import {
  buildCatalogSpellTargets,
  evaluateAnswerRank,
  findTypoSuggestion,
  matchPlayerAnswer,
  normalizeAnswerText,
} from './utils/matching';
import { soundEngine } from './utils/sound';
import {
  loadDailyProgress,
  loadLocalAnswerCounts,
  loadMutedPreference,
  loadReducedMotionPreference,
  recordLocalAnswerPick,
  saveDailyRunCompleted,
  saveMutedPreference,
  saveReducedMotionPreference,
  type DailyProgress,
} from './utils/storage';
import {
  fetchQuestionAnswerStats,
  recordCommunityAnswerPick,
  signInWithGoogle,
  signOutUser,
  subscribeAuthUser,
} from './services/firebase';
import { RiftJourneyCanvas } from './components/RiftJourneyCanvas';
import { RevealCard } from './components/RevealCard';
import { SummaryScreen } from './components/SummaryScreen';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ScoreboardPanel } from './components/ScoreboardPanel';
import { RankCrest } from './components/RankCrest';
import {
  HextechCrestIcon,
  NexusDiamondIcon,
  RuneterraDivider,
  SummonerSwordIcon,
} from './components/LoLSymbols';

const ROUND_SECONDS = 25;
const TOTAL_ROUNDS = 7;

const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  champions: 'Champions',
  abilities: 'Abilities',
  items: 'Items',
  skins: 'Skin Lines',
  lore: 'Regions & Lore',
};

function pickAnnouncerLine(rank: RankId, seedIdx: number): string {
  const lines = RANKS[rank].announcerLines;
  return lines[seedIdx % lines.length];
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] runeterra-bg flex items-center justify-center p-4 text-[#f0e6d2]">
          <div className="max-w-md rounded-xl border border-[#f43f5e]/50 bg-[#0c1322] p-6 text-center space-y-4">
            <h2 className="font-display text-xl font-bold">Unexpected Rift Anomaly</h2>
            <p className="text-sm text-[#c8c2b6]">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#c8aa6e] text-[#090d16] font-semibold text-sm cursor-pointer"
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RiftRarityApp() {
  const [riftData, setRiftData] = useState<RiftData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);

  const [screen, setScreen] = useState<GameScreen>('title');
  const [mode, setMode] = useState<GameMode>('daily');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [progress, setProgress] = useState(0);

  const [roundPhase, setRoundPhase] = useState<'answering' | 'reveal'>('answering');
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_SECONDS * 1000);
  const [guess, setGuess] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [questionStats, setQuestionStats] = useState<AnswerPickCounts>({});

  const [diamondStreak, setDiamondStreak] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [screenShake, setScreenShake] = useState<'none' | 'medium' | 'epic'>('none');

  const [muted, setMuted] = useState<boolean>(() => {
    const m = loadMutedPreference();
    soundEngine.setMuted(m);
    return m;
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => loadReducedMotionPreference());
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => loadDailyProgress());
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const roundDeadlineRef = useRef<number>(0);
  const lastTickSecRef = useRef<number>(ROUND_SECONDS + 1);

  useEffect(() => {
    const unsub = subscribeAuthUser((u) => setUser(u));
    return () => unsub();
  }, []);

  const fetchGameData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await loadRiftData();
      setRiftData(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to reach Riot Data Dragon. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGameData();
  }, [fetchGameData]);

  const currentQuestion = questions[roundIdx] ?? null;

  const questionPoolSize = useMemo(
    () => (riftData ? buildQuestionPool(riftData).length : 0),
    [riftData]
  );

  const currentValidAnswers: ValidAnswerEntry[] = useMemo(() => {
    if (!riftData || !currentQuestion) return [];
    return currentQuestion.resolveAnswers(riftData);
  }, [riftData, currentQuestion]);

  // Full catalog spellcheck (never filtered to valid answers, so it never leaks hints)
  const spellCatalog = useMemo(() => {
    if (!riftData || !currentQuestion) return [];
    return buildCatalogSpellTargets(riftData, currentQuestion.answerKind);
  }, [riftData, currentQuestion]);

  const typoSuggestion = useMemo(() => {
    if (roundPhase !== 'answering' || !guess.trim()) return null;
    return findTypoSuggestion(guess, spellCatalog);
  }, [guess, spellCatalog, roundPhase]);

  const championNamesSet = useMemo(() => {
    if (!riftData) return new Set<string>();
    const s = new Set<string>();
    for (const c of riftData.champions) {
      s.add(normalizeAnswerText(c.name));
      s.add(normalizeAnswerText(c.id));
    }
    return s;
  }, [riftData]);

  // Load community + local answer pick counts for the active question
  useEffect(() => {
    if (screen !== 'playing' || !currentQuestion) return;
    let active = true;
    const localCounts = loadLocalAnswerCounts(currentQuestion.id);
    setQuestionStats(localCounts);

    fetchQuestionAnswerStats(currentQuestion.id)
      .then((remoteCounts) => {
        if (!active) return;
        const merged: AnswerPickCounts = { ...localCounts };
        for (const [ansId, count] of Object.entries(remoteCounts)) {
          merged[ansId] = Math.max(merged[ansId] ?? 0, count);
        }
        setQuestionStats(merged);
      })
      .catch(() => {
        // Keep local counts silently if remote query fails
      });

    return () => {
      active = false;
    };
  }, [screen, currentQuestion]);

  const triggerRankEffects = useCallback(
    (rank: RankId, gained: number) => {
      soundEngine.playRankReveal(rank);
      if (gained > 0) {
        setTimeout(() => {
          soundEngine.playWhoosh(Math.min(1, gained / 18));
        }, 120);
      }
      setBurstKey((k) => k + 1);

      const shake = RANKS[rank].shakeLevel;
      if (!reducedMotion && shake !== 'none') {
        setScreenShake(shake);
        setTimeout(() => setScreenShake('none'), 620);
      }
    },
    [reducedMotion]
  );

  const finishRoundWithTimeout = useCallback(() => {
    if (!currentQuestion || roundPhase !== 'answering') return;
    const rank: RankId = 'iron';
    const result: RoundResult = {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      prompt: currentQuestion.prompt,
      answered: false,
      answerDisplay: 'Time Expired',
      rank,
      points: 0,
      announcerLine: pickAnnouncerLine(rank, roundIdx),
      distanceGained: 0,
      distanceAfter: progress,
    };
    setDiamondStreak(0);
    setResults((prev) => [...prev, result]);
    setRoundPhase('reveal');
    triggerRankEffects(rank, 0);
  }, [currentQuestion, roundPhase, roundIdx, progress, triggerRankEffects]);

  // 25-second round countdown timer
  useEffect(() => {
    if (screen !== 'playing' || roundPhase !== 'answering' || !currentQuestion) return;

    roundDeadlineRef.current = performance.now() + ROUND_SECONDS * 1000;
    lastTickSecRef.current = ROUND_SECONDS + 1;
    setTimeLeftMs(ROUND_SECONDS * 1000);

    const interval = window.setInterval(() => {
      const remaining = Math.max(0, roundDeadlineRef.current - performance.now());
      setTimeLeftMs(remaining);

      const ceilSec = Math.ceil(remaining / 1000);
      if (ceilSec <= 5 && ceilSec >= 1 && ceilSec < lastTickSecRef.current) {
        lastTickSecRef.current = ceilSec;
        soundEngine.playTick(ceilSec);
      }

      if (remaining <= 0) {
        window.clearInterval(interval);
        finishRoundWithTimeout();
      }
    }, 60);

    return () => window.clearInterval(interval);
  }, [screen, roundPhase, roundIdx, currentQuestion, finishRoundWithTimeout]);

  useEffect(() => {
    if (screen === 'playing' && roundPhase === 'answering') {
      const id = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(id);
    }
  }, [screen, roundPhase, roundIdx]);

  const startNewRun = (selectedMode: GameMode) => {
    if (!riftData) return;
    soundEngine.unlock();
    const todayKey = getTodayUtcKey();

    if (selectedMode === 'daily' && dailyProgress.todayResults) {
      const saved = dailyProgress.todayResults;
      const finalDist = saved[saved.length - 1]?.distanceAfter ?? 0;
      setMode('daily');
      setResults(saved);
      setProgress(finalDist);
      setScreen('summary');
      return;
    }

    const runQuestions = selectRunQuestions(selectedMode, riftData, todayKey);
    setMode(selectedMode);
    setQuestions(runQuestions);
    setRoundIdx(0);
    setResults([]);
    setProgress(0);
    setDiamondStreak(0);
    setGuess('');
    setFeedbackMsg(null);
    setRoundPhase('answering');
    setScreen('playing');
  };

  const applyTypoAutocomplete = () => {
    if (!typoSuggestion) return;
    setGuess(typoSuggestion.submitText);
    setFeedbackMsg(null);
    inputRef.current?.focus();
  };

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (roundPhase !== 'answering' || !currentQuestion) return;
    soundEngine.unlock();

    const trimmed = guess.trim();
    if (!trimmed) return;

    // 1. Try exact/alias match first
    let matched = matchPlayerAnswer(trimmed, currentValidAnswers);
    let correctedFromTypo: string | null = null;

    // 2. If misspelled (e.g. "yumi" -> "Yuumi", "marumana" -> "Muramana"), auto-resolve the catalog typo
    if (!matched && typoSuggestion && typoSuggestion.distance <= 2) {
      const candidate = matchPlayerAnswer(typoSuggestion.submitText, currentValidAnswers);
      if (candidate) {
        matched = candidate;
        correctedFromTypo = typoSuggestion.displayName;
      } else {
        // Show that we understood what they meant, even though it isn't valid for this prompt
        soundEngine.playInvalidTry();
        setIsInputShaking(true);
        window.setTimeout(() => setIsInputShaking(false), 380);
        setGuess(typoSuggestion.submitText);
        setFeedbackMsg(
          `"${typoSuggestion.displayName}" is not a valid match for this prompt — try another!`
        );
        return;
      }
    }

    if (!matched) {
      soundEngine.playInvalidTry();
      setIsInputShaking(true);
      window.setTimeout(() => setIsInputShaking(false), 380);
      if (
        currentQuestion.answerKind === 'ability' &&
        championNamesSet.has(normalizeAnswerText(trimmed))
      ) {
        setFeedbackMsg("That's a champion — type the ability name itself!");
      } else if (typoSuggestion) {
        setFeedbackMsg(`Click "${typoSuggestion.displayName}" or press Tab to use it.`);
      } else {
        setFeedbackMsg('Not a valid answer for this prompt — try again!');
      }
      return;
    }

    const rank = evaluateAnswerRank(matched, currentValidAnswers, questionStats);
    const secondsRemaining = timeLeftMs / 1000;
    const roundPoints = computeRoundPoints(rank, secondsRemaining);
    const gained = RANKS[rank].travelDistance;
    const nextProgress = Math.min(100, progress + gained);

    // Record pick frequency locally & in Firestore for future days
    recordLocalAnswerPick(currentQuestion.id, matched.id);
    void recordCommunityAnswerPick(currentQuestion.id, matched.id, matched.displayName).catch(
      () => {}
    );

    const newStreak = isDiamondOrBetter(rank) ? diamondStreak + 1 : 0;
    setDiamondStreak(newStreak);
    setProgress(nextProgress);
    setFeedbackMsg(null);

    const result: RoundResult = {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      prompt: currentQuestion.prompt,
      answered: true,
      answerDisplay: matched.displayName,
      answerSubtitle: correctedFromTypo
        ? `${matched.subtitle ? `${matched.subtitle} · ` : ''}Matched "${correctedFromTypo}"`
        : matched.subtitle,
      imageUrl: matched.imageUrl,
      fallbackImageUrl: matched.fallbackImageUrl,
      imageKind: matched.imageKind,
      rank,
      points: roundPoints,
      announcerLine: pickAnnouncerLine(rank, roundIdx + matched.displayName.length),
      distanceGained: gained,
      distanceAfter: nextProgress,
    };

    setResults((prev) => [...prev, result]);
    setRoundPhase('reveal');
    triggerRankEffects(rank, gained);
  };

  const handleNextRound = useCallback(() => {
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      if (mode === 'daily') {
        const updated = saveDailyRunCompleted(results);
        setDailyProgress(updated);
      }
      soundEngine.playRunComplete(progress >= 92);
      setScreen('summary');
      return;
    }

    setRoundIdx((i) => i + 1);
    setGuess('');
    setFeedbackMsg(null);
    setRoundPhase('answering');
  }, [roundIdx, mode, results, progress]);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
    saveMutedPreference(next);
  };

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    saveReducedMotionPreference(next);
  };

  const secondsDisplay = Math.ceil(timeLeftMs / 1000);
  const timerRatio = Math.max(0, Math.min(1, timeLeftMs / (ROUND_SECONDS * 1000)));
  const isUrgent = secondsDisplay <= 5 && roundPhase === 'answering';
  const latestResult = results[results.length - 1] ?? null;
  const currentTotalScore = results.reduce((sum, r) => sum + (r.points ?? 0), 0);

  const shakeClass =
    screenShake === 'epic'
      ? 'animate-shake-epic'
      : screenShake === 'medium'
      ? 'animate-shake-medium'
      : '';

  return (
    <div className={`min-h-[100dvh] flex flex-col runeterra-bg text-[#f0e6d2] ${shakeClass}`}>
      {/* League-Themed Top Navigation Bar with Instant Play Actions */}
      <header className="sticky top-0 z-30 border-b border-[#785a28]/45 bg-[#070b14]/92 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setScreen('title')}
            className="inline-flex items-center gap-2 font-display text-base sm:text-xl font-bold tracking-wider text-[#f0e6d2] hover:text-[#c8aa6e] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HextechCrestIcon className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            <span>Rift Rarity</span>
          </button>

          {/* Instant Play & Scoreboard Header Links */}
          {!loading && !loadError && (
            <nav className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => startNewRun('daily')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#070b14] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dailyProgress.todayResults ? "Today's Daily" : 'Play Daily'}</span>
              </button>
              <button
                type="button"
                onClick={() => startNewRun('unlimited')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0ac8b9]/55 bg-[#0c1a2a] hover:bg-[#11263c] text-[#0ac8b9] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SummonerSwordIcon className="w-3.5 h-3.5" />
                <span>Play Unlimited</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('scoreboard')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  screen === 'scoreboard'
                    ? 'bg-white/10 text-[#fcd34d]'
                    : 'text-[#c8c2b6] hover:text-[#f0e6d2] hover:bg-white/5'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-[#c8aa6e]" />
                <span>Scoreboard</span>
              </button>
            </nav>
          )}

          {/* Utility Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setScreen('scoreboard')}
              className="md:hidden inline-flex items-center p-2 rounded-lg text-[#c8aa6e] hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Scoreboard"
              title="Scoreboard"
            >
              <Trophy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setHowToPlayOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#c8c2b6] hover:text-[#f0e6d2] hover:bg-white/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="How to Play"
            >
              <HelpCircle className="w-4 h-4 text-[#c8aa6e]" />
              <span className="hidden lg:inline">Rules</span>
            </button>

            <button
              type="button"
              onClick={toggleReducedMotion}
              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                reducedMotion
                  ? 'bg-[#17233a] text-[#0ac8b9]'
                  : 'text-[#c8c2b6] hover:text-[#f0e6d2] hover:bg-white/5'
              }`}
              aria-pressed={reducedMotion}
              title="Toggle Reduced Motion"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden xl:inline">{reducedMotion ? 'Reduced' : 'Motion'}</span>
            </button>

            <button
              type="button"
              onClick={toggleMuted}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[#c8c2b6] hover:text-[#f0e6d2] hover:bg-white/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              aria-pressed={muted}
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-[#f43f5e]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#c8aa6e]" />
              )}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => void signOutUser()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#785a28]/45 bg-[#0e1626] hover:bg-[#16223a] text-xs font-medium text-[#e5dcc9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title={`Signed in as ${user.displayName || user.email} — Click to sign out`}
              >
                <span className="max-w-[78px] truncate hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'Summoner'}
                </span>
                <LogOut className="w-3.5 h-3.5 text-[#a09b8c]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#c8aa6e]/50 bg-[#121c30] hover:bg-[#1a2842] text-xs font-semibold text-[#f0e6d2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#c8aa6e]" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-3 sm:px-4 py-4 sm:py-5 flex flex-col">
        {loading ? (
          <div className="my-auto py-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#c8aa6e]/30 border-t-[#c8aa6e] animate-spin" />
            <div>
              <p className="font-display text-lg font-bold text-[#f0e6d2]">
                Syncing Summoner&apos;s Rift Archives
              </p>
              <p className="text-sm text-[#a09b8c] mt-1">
                Loading live champions, abilities, skins, and items from Data Dragon...
              </p>
            </div>
          </div>
        ) : loadError ? (
          <div className="my-auto max-w-md mx-auto rounded-xl border border-[#f43f5e]/40 bg-[#0c1322] p-6 text-center space-y-4">
            <h2 className="font-display text-xl font-bold text-[#f0e6d2]">
              Could Not Reach Data Dragon
            </h2>
            <p className="text-sm text-[#c8c2b6]">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchGameData()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#090d16] font-semibold text-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : screen === 'title' ? (
          <div className="space-y-5">
            {/* TOP ABOVE-THE-FOLD PLAY PANEL — Immediate access with zero scrolling */}
            <section className="rounded-xl border border-[#785a28]/55 bg-gradient-to-br from-[#10192d]/95 via-[#0b1220]/95 to-[#090d17]/95 p-4 sm:p-6 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0ac8b9]">
                    <NexusDiamondIcon className="w-4 h-4" />
                    <span>League of Legends Obscurity Trivia</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#f0e6d2] mt-1.5 leading-tight [text-wrap:balance]">
                    Pull obscure picks. Breach the Enemy Nexus.
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#c8c2b6] leading-relaxed">
                    Drawn from {questionPoolSize.toLocaleString()} live Data Dragon prompts · 7
                    rounds · 25 seconds each · Community picks shift answer rarity daily.
                  </p>
                </div>

                {/* Primary Mode Buttons right at the top */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 lg:w-[430px]">
                  <button
                    type="button"
                    onClick={() => startNewRun('daily')}
                    className="group text-left rounded-xl border border-[#c8aa6e]/70 bg-gradient-to-br from-[#1a2640] to-[#0f1729] hover:border-[#fcd34d] p-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa6e]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c8aa6e]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{getTodayUtcKey()}</span>
                      </span>
                      <RankCrest rank="challenger" size={28} />
                    </div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#f0e6d2] mt-1 group-hover:text-[#fcd34d] transition-colors">
                      {dailyProgress.todayResults ? "View Today's Daily" : 'Play Daily Rift'}
                    </h2>
                    <p className="text-[11px] text-[#a09b8c] mt-0.5 flex items-center gap-1.5">
                      {dailyProgress.streak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[#fb923c] font-semibold">
                          <Flame className="w-3 h-3" />
                          {dailyProgress.streak}-day streak
                        </span>
                      ) : (
                        <span>Shared 7-question path</span>
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => startNewRun('unlimited')}
                    className="group text-left rounded-xl border border-[#0ac8b9]/55 bg-gradient-to-br from-[#0e2231] to-[#0b1322] hover:border-[#0ac8b9] p-4 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ac8b9]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0ac8b9]">
                        <SummonerSwordIcon className="w-3.5 h-3.5" />
                        <span>Endless Mode</span>
                      </span>
                      <RankCrest rank="diamond" size={28} />
                    </div>
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#f0e6d2] mt-1 group-hover:text-[#0ac8b9] transition-colors">
                      Play Unlimited
                    </h2>
                    <p className="text-[11px] text-[#a09b8c] mt-0.5">
                      Fresh randomized run anytime
                    </p>
                  </button>
                </div>
              </div>
            </section>

            {/* COMPACT Progress/Horizon Bar on Home Page */}
            <RiftJourneyCanvas
              progress={18}
              reducedMotion={reducedMotion}
              heightClass="h-24 sm:h-28"
            />

            <RuneterraDivider />

            {/* Live Summoner Scoreboard Showcase */}
            <ScoreboardPanel user={user} compact />
          </div>
        ) : screen === 'scoreboard' ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#f0e6d2]">
                  Hall of Summoners
                </h1>
                <p className="text-xs sm:text-sm text-[#a09b8c]">
                  Daily standings reset at 00:00 UTC. Answer rarity shifts dynamically with player
                  picks.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startNewRun('daily')}
                  className="px-4 py-2 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#070b14] font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Play Daily
                </button>
                <button
                  type="button"
                  onClick={() => startNewRun('unlimited')}
                  className="px-4 py-2 rounded-lg border border-[#0ac8b9]/55 bg-[#0c1a2a] hover:bg-[#11263c] text-[#0ac8b9] font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Play Unlimited
                </button>
              </div>
            </div>
            <ScoreboardPanel user={user} />
          </div>
        ) : screen === 'playing' && currentQuestion ? (
          <div className="space-y-4 sm:space-y-5 pt-1 sm:pt-3">
            {/* NORMAL-SIZED Journey Canvas when Playing */}
            <RiftJourneyCanvas
              progress={progress}
              lastRank={latestResult?.rank ?? null}
              burstKey={burstKey}
              reducedMotion={reducedMotion}
              heightClass="h-40 sm:h-52 md:h-60"
            />

            {roundPhase === 'answering' ? (
              <div className="rounded-xl border border-[#785a28]/55 bg-[#0c1322]/95 p-4 sm:p-6 shadow-2xl space-y-4">
                {/* Round Metadata & Timer Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#a09b8c]">
                    <span className="text-[#c8aa6e] font-semibold">
                      Question {roundIdx + 1} of {TOTAL_ROUNDS}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{CATEGORY_LABELS[currentQuestion.category]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[#fcd34d]">
                      {currentTotalScore.toLocaleString()} pts
                    </span>
                    {diamondStreak >= 2 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-[#fb923c] font-semibold">
                          <Flame className="w-3.5 h-3.5 animate-flame" />
                          Hot Streak ×{diamondStreak}
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className={`font-mono tabular-nums text-base sm:text-lg font-bold tracking-tight ${
                      isUrgent ? 'text-[#f43f5e]' : 'text-[#f0e6d2]'
                    }`}
                    aria-live="polite"
                  >
                    {secondsDisplay}s
                  </div>
                </div>

                {/* Timer Bar */}
                <div className="h-1.5 w-full rounded-full bg-[#192338] overflow-hidden">
                  <div
                    className="h-full transition-[width] duration-75 ease-linear"
                    style={{
                      width: `${timerRatio * 100}%`,
                      backgroundColor: isUrgent ? '#f43f5e' : '#0ac8b9',
                    }}
                  />
                </div>

                {/* Question Prompt */}
                <div>
                  <h2 className="font-display text-lg sm:text-2xl font-bold text-[#f0e6d2] leading-snug [text-wrap:balance]">
                    {currentQuestion.prompt}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#a09b8c]">{currentQuestion.hint}</p>
                </div>

                {/* Input Form (never remounted so mobile focus and layout stay locked) */}
                <form
                  onSubmit={handleSubmitGuess}
                  className={`flex gap-2.5 ${isInputShaking && !reducedMotion ? 'animate-input-shake' : ''}`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={guess}
                    onChange={(e) => {
                      setGuess(e.target.value);
                      if (feedbackMsg) setFeedbackMsg(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && typoSuggestion) {
                        e.preventDefault();
                        applyTypoAutocomplete();
                      }
                    }}
                    placeholder="Type your answer..."
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="flex-1 min-w-0 rounded-lg border border-[#785a28]/60 bg-[#070b14] px-4 py-3 text-base text-[#f0e6d2] placeholder:text-[#68645c] focus:outline-none focus:border-[#0ac8b9] transition-colors"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#090d16] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa6e]"
                  >
                    <span className="hidden sm:inline">Lock In</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Fixed-height reservation for spellcheck & feedback — prevents ANY screen shift */}
                <div className="h-10 flex items-center overflow-hidden">
                  {typoSuggestion ? (
                    <div className="flex items-center gap-2 text-xs text-[#b9b2a3] min-w-0 w-full">
                      <span className="shrink-0">Did you mean</span>
                      <button
                        type="button"
                        onClick={applyTypoAutocomplete}
                        className="px-2.5 py-1 rounded-md border border-[#0ac8b9]/55 bg-[#0c1d2e] hover:bg-[#122a42] text-[#0ac8b9] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {typoSuggestion.displayName}
                      </button>
                      {feedbackMsg ? (
                        <span className="text-[#fb923c] truncate">{feedbackMsg}</span>
                      ) : (
                        <span className="text-[#78746b] hidden sm:inline truncate">
                          (Tab to fill, or Enter to lock in)
                        </span>
                      )}
                    </div>
                  ) : feedbackMsg ? (
                    <p
                      className="text-xs sm:text-sm font-medium text-[#fb923c] truncate w-full"
                      role="status"
                    >
                      {feedbackMsg}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              latestResult && (
                <RevealCard
                  result={latestResult}
                  roundIndex={roundIdx}
                  totalRounds={TOTAL_ROUNDS}
                  diamondStreak={diamondStreak}
                  reducedMotion={reducedMotion}
                  onNext={handleNextRound}
                />
              )
            )}
          </div>
        ) : (
          <SummaryScreen
            mode={mode}
            results={results}
            finalProgress={progress}
            dailyStreak={dailyProgress.streak}
            reducedMotion={reducedMotion}
            user={user}
            onPlayUnlimited={() => startNewRun('unlimited')}
            onReturnTitle={() => setScreen('title')}
          />
        )}
      </main>

      {/* Unofficial Fan Project Footer */}
      <footer className="border-t border-[#785a28]/30 bg-[#060911] py-4 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-[11px] sm:text-xs text-[#7d7970]">
          <p>
            Rift Rarity is an unofficial fan project and is not endorsed by Riot Games. Riot Games,
            League of Legends, and all associated properties are trademarks of Riot Games, Inc.
          </p>
          {riftData && (
            <span className="whitespace-nowrap shrink-0 text-[#66625a]">
              Patch {riftData.version}
            </span>
          )}
        </div>
      </footer>

      <HowToPlayModal open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <RiftRarityApp />
    </AppErrorBoundary>
  );
}
