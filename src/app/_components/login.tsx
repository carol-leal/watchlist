"use client";

import React from "react";
import { Button } from "@heroui/react";
import Logo from "./logo";
import { signInWithDiscord } from "./login-actions";

import Image from "next/image";
export default function LoginComponent() {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <Logo />
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-sm flex-col gap-4">
          <div className="flex flex-col items-center pb-6">
            <p className="text-xl font-medium">Welcome Back</p>
            <p className="text-small text-default-500">
              Log in to your account to continue
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 ">
            <LoginButton
              icon="https://img.clerk.com/static/discord.png?width=160"
              name="Discord"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const LoginButton = ({ icon, name }: { icon: string; name: string }) => {
  return (
    <Button fullWidth variant="outline" onClick={() => signInWithDiscord()}>
      <Image alt={name} src={icon} width={24} height={24} />
      Continue with {name}
    </Button>
  );
};
