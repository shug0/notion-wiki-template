"use client";

export function Logger({ message }: { message: string }) {
  if (process.env.NODE_ENV === "development") {
    console.log(message);
  }

  return null;
}
