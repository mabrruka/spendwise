
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

const signupSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Name must be at least 2 characters.")
            .max(100, "Name must be 100 characters or less."),

        email: z
            .email("Enter a valid email address.")
            .trim()
            .toLowerCase(),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters.")
            .max(72, "Password must be 72 characters or less."),

        confirmPassword: z.string(),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match.",
            path: ["confirmPassword"],
        },
    );

export async function signup(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    };

    const parsed = signupSchema.safeParse(rawData);

    if (!parsed.success) {
        const firstError =
            parsed.error.issues[0]?.message ??
            "Please check your information.";

        redirect(
            `/signup?error=${encodeURIComponent(firstError)}`,
        );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
        select: {
            id: true,
        },
    });

    if (existingUser) {
        redirect(
            "/signup?error=An%20account%20with%20this%20email%20already%20exists.",
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            redirect(
                "/signup?error=An%20account%20with%20this%20email%20already%20exists.",
            );
        }

        throw error;
    }

    redirect("/signin?registered=1");
}
