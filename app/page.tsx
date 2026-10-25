
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function HomeRedirect(): Promise<React.ReactNode> {
    // Wait for an actual request before checking authentication.
    await connection();

    const session = await auth();

    if (session?.user?.id) {
        redirect("/dashboard");
    }

    redirect("/signin");
}

export default function Home() {
    return (
        <Suspense fallback={null}>
            <HomeRedirect />
        </Suspense>
    );
}
