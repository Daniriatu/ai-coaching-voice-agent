import { AssemblyAI } from "assemblyai";
import { NextResponse } from "next/server";

const assemblyAi = new AssemblyAI({apiKey:process.env.ASSEMBLY_API_KEY})

export async function GET(req) {
    const token= await assemblyAi.realtime.createTemporaryToken({expires_in:360000})
    return NextResponse.json(token)
}