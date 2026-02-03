"use client";

import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, } from "firebase/firestore";
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut, } from "firebase/auth";
import { auth, db } from "@/lib/Firebase";
import QuestionCard, { Question } from "@/components/QuestionCard";

export default function DiscussionPage() {
  const provider = useMemo(() => new GoogleAuthProvider(), []);
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const questionsQuery = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(questionsQuery, (snapshot) => {
      const items = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<Question, "id">),
      }));
      setQuestions(items);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "questions"), {
        title: title.trim(),
        body: body.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || "Anonymous",
        createdAt: serverTimestamp(),
        voteScore: 0,
        votes: {},
      });

      setTitle("");
      setBody("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_45%),radial-gradient(circle_at_bottom,_rgba(15,118,110,0.18),_transparent_40%),linear-gradient(120deg,_#f8fafc_0%,_#f1f5f9_40%,_#e2e8f0_100%)] px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Community Hub
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              MedHack Discussion Board
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Ask technical questions, share images from prototypes, and vote the best answers to
              the top.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {user ? (
              <>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  Signed in as {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={() => signOut(auth)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => signInWithPopup(auth, provider)}
                className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Sign in with Google to post
              </button>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">Ask a question</h2>
          <p className="mt-1 text-sm text-slate-600">
            Include details, screenshots, or mockups to get faster answers.
          </p>

          <form onSubmit={handleSubmitQuestion} className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What are you trying to solve?"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  disabled={!user || submitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Details
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Share context, expectations, and what you've tried so far."
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                disabled={!user || submitting}
              />
            </div>

            <button
              type="submit"
              disabled={!user || submitting}
              className="rounded-full bg-emerald-600 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Posting question..." : "Publish question"}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Latest questions</h2>
            <span className="text-xs text-slate-500">{questions.length} total</span>
          </div>

          <div className="space-y-6">
            {questions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500">
                No questions yet. Start the first thread above.
              </div>
            ) : (
              questions.map((question) => (
                <QuestionCard key={question.id} question={question} user={user} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
