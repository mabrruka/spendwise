
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StartPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/signin");
    }

    redirect("/dashboard");
}
