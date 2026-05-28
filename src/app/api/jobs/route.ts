import { NextResponse } from "next/server";
// In a real app, you would import a singleton Prisma client here.
// import prisma from "@/lib/prisma"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, customerId, containerSize, invoiceRef, codeRef, vgm, cutOffTime, legs } = body;

    // TODO: Validate input with Zod

    /*
    const newJob = await prisma.job.create({
      data: {
        date: new Date(date),
        customerId,
        containerSize,
        invoiceRef,
        codeRef,
        vgm,
        cutOffTime: cutOffTime ? new Date(cutOffTime) : null,
        // Nested write for creating the initial legs (e.g. Factory -> Port)
        legs: {
          create: legs.map((leg: any, index: number) => ({
            sequenceOrder: index + 1,
            originId: leg.originId,
            destinationId: leg.destinationId,
            driverId: leg.driverId,
            truckId: leg.truckId,
            distanceKm: leg.distanceKm || 0,
            isBillable: leg.isBillable || false,
          })),
        },
      },
      include: { legs: true },
    });
    */

    // MOCK RESPONSE FOR NOW
    return NextResponse.json({ message: "Job created with initial legs successfully", job: body }, { status: 201 });
  } catch (error) {
    console.error("Failed to create job", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
