"use client"

import React, { useState, useEffect } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/Firebase';

function Page() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idea: '',
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Step 1: Starting sign in with popup...");
      const result = await signInWithPopup(auth, provider);
      console.log("Step 2: Sign in successful, user:", result.user.email);

      console.log("Step 3: Getting ID token...");
      const idToken = await result.user.getIdToken();
      console.log("Step 4: ID token obtained (length):", idToken.length);

      const payload = {
        idToken,
        name: formData.name,
        email: formData.email,
        idea: formData.idea
      };

      console.log("Step 5: Sending request to API with payload:", {
        ...payload,
        idToken: idToken.substring(0, 20) + "..." // Log partial token for security
      });

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log("Step 6: Response status:", response.status);

      const responseData = await response.json();
      console.log("Step 7: Response data:", responseData);

      if (response.ok) {
        alert("Success! Your idea has been saved securely.");
        // Clear form
        setFormData({ name: '', email: '', idea: '' });
      } else {
        console.error("API Error:", responseData);
        alert(`Error: ${responseData.error || "Failed to save data"}\nDetails: ${responseData.details || 'None'}`);
      }

    } catch (error: any) {
      console.error("Submission error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`An error occurred: ${error.message}\nCheck the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user?.email || "No user");
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className='flex min-h-screen items-center justify-center bg-white dark:bg-black font-sans'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 border-2 p-10 rounded-md'>
        <h2 className="text-xl font-bold mb-4">Submit Your Idea</h2>

        {user && (
          <div className="bg-blue-50 p-2 rounded text-sm text-blue-700 mb-2">
            Logged in as: {user.email}
          </div>
        )}

        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          required
          onChange={handleChange}
          className='rounded-md border border-gray-300 p-2 text-black dark:text-white'
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          required
          onChange={handleChange}
          className='rounded-md border border-gray-300 p-2 text-black dark:text-white'
        />

        <label htmlFor="idea">Idea</label>
        <textarea
          name="idea"
          id="idea"
          value={formData.idea}
          required
          onChange={handleChange}
          className='rounded-md border border-gray-300 p-2 text-black dark:text-white'
          rows={4}
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className='rounded-md bg-blue-500 p-2 text-white font-bold hover:bg-blue-600 disabled:bg-gray-400'
        >
          {loading ? "Submitting..." : "Sign In & Submit"}
        </button>

        {user && (
          <button
            type="button"
            onClick={() => signOut(auth)}
            className='rounded-md bg-red-500 p-2 text-white'
          >
            Sign Out
          </button>
        )}
      </form>
    </div>
  )
}

export default Page