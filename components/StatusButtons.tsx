"use client"

import { useState } from "react";
import { updateUserStatus } from "@/app/actions/updateStatus";

interface StatusButtonsProps {
    userId: string;
    color: string;
    status: string;
}

export default function StatusButtons({ userId, color, status }: StatusButtonsProps) {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (approved: boolean, status: string) => {
        setLoading(true);
        await updateUserStatus(userId, approved, status);
        setLoading(false);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleUpdate(true, status)}
                className={`bg-${color}-500 hover:bg-${color}-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50`}
            >
                {status}
            </button>
        </div>
    );
}