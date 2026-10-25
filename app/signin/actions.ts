
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();

    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        redirect("/signin?error=missing");
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/signin?error=invalid");
        }

        // Auth.js may throw a Next.js redirect after
        // successful authentication. Preserve it.
        throw error;
    }
}
