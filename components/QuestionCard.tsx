import { useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/Firebase";

export type Question = {
    id: string;
    title: string;
    body: string;
    authorId: string;
    authorName: string;
    createdAt?: any;
    voteScore?: number;
};

type Answer = {
    id: string;
    body: string;
    authorId: string;
    authorName: string;
    createdAt?: any;
    voteScore?: number;
};

type VoteTarget = {
    refPath: string[];
    currentScore?: number;
};

const formatDate = (value?: any) => {
    if (!value?.toDate) return "Just now";
    const date = value.toDate() as Date;
    return date.toLocaleString();
};

const buildVoteScore = (votes: Record<string, number>) =>
    Object.values(votes).reduce((sum, value) => sum + (typeof value === "number" ? value : 0), 0);

const voteOnDocument = async (userId: string, target: VoteTarget, value: 1 | -1) => {
    const docRef = doc(db, target.refPath.join("/"));
    await runTransaction(db, async (tx) => {
        const snapshot = await tx.get(docRef);
        if (!snapshot.exists()) return;
        const data = snapshot.data() as { votes?: Record<string, number> };
        const votes = { ...(data.votes || {}) };
        const current = votes[userId] || 0;
        let next: number = value;

        if (current === value) {
            next = 0;
        }

        if (next === 0) {
            delete votes[userId];
        } else {
            votes[userId] = next;
        }

        tx.update(docRef, {
            votes,
            voteScore: buildVoteScore(votes),
        });
    });
};

export default function QuestionCard({ question, user, }: { question: Question; user: User | null; }) {

    const [answers, setAnswers] = useState<Answer[]>([]);
    const [answerText, setAnswerText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const answersQuery = query(
            collection(db, "questions", question.id, "answers"),
            orderBy("createdAt", "asc")
        );
        const unsubscribe = onSnapshot(answersQuery, (snapshot) => {
            const items = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...(docItem.data() as Omit<Answer, "id">),
            }));
            setAnswers(items);
        });
        return () => unsubscribe();
    }, [question.id]);

    const handleSubmitAnswer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user) return;
        if (!answerText.trim()) return;
        setSubmitting(true);
        try {
            await addDoc(collection(db, "questions", question.id, "answers"), {
                body: answerText.trim(),
                authorId: user.uid,
                authorName: user.displayName || user.email || "Anonymous",
                createdAt: serverTimestamp(),
                voteScore: 0,
                votes: {},
            });
            setAnswerText("");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/20 bg-white/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 p-6 md:p-8">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{question.title}</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {formatDate(question.createdAt)}
                        </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{question.body}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Asked by {question.authorName}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                        <span>Score {question.voteScore ?? 0}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            user && voteOnDocument(user.uid, { refPath: ["questions", question.id] }, 1)
                        }
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                        disabled={!user}
                    >
                        Upvote
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            user && voteOnDocument(user.uid, { refPath: ["questions", question.id] }, -1)
                        }
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                        disabled={!user}
                    >
                        Downvote
                    </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                        <span>{answers.length} Answers</span>
                        {!user && <span className="text-xs font-normal text-slate-500">Sign in to reply</span>}
                    </div>

                    <div className="space-y-4">
                        {answers.length === 0 && (
                            <p className="text-xs text-slate-500">Be the first to answer this question.</p>
                        )}
                        {answers.map((answer) => (
                            <div key={answer.id} className="rounded-xl border border-white/40 bg-white px-4 py-3">
                                <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-slate-500">
                                    <span>{answer.authorName}</span>
                                    <span>{formatDate(answer.createdAt)}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-700">{answer.body}</p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span>Score {answer.voteScore ?? 0}</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            user &&
                                            voteOnDocument(
                                                user.uid,
                                                { refPath: ["questions", question.id, "answers", answer.id] },
                                                1
                                            )
                                        }
                                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                                        disabled={!user}
                                    >
                                        Upvote
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            user &&
                                            voteOnDocument(
                                                user.uid,
                                                { refPath: ["questions", question.id, "answers", answer.id] },
                                                -1
                                            )
                                        }
                                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                                        disabled={!user}
                                    >
                                        Downvote
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmitAnswer} className="space-y-3">
                        <textarea
                            value={answerText}
                            onChange={(event) => setAnswerText(event.target.value)}
                            placeholder="Write your answer..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            disabled={!user || submitting}
                        />
                        <button
                            type="submit"
                            disabled={!user || submitting}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Posting..." : "Post answer"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
