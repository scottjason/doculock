"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const getUsers = async () => {
      const response = await fetch("http://localhost:8000/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      console.log(data);
    };
    getUsers();
  }, []);
  return (
    <div className="h-screen w-screen bg-black grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]"></div>
  );
}
