
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function HomeRedirect(): Promise<React.ReactNode> {
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
