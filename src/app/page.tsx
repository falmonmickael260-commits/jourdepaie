"use client";

import { useState } from "react";
import { IntroLoader } from "@/components/loader/IntroLoader";
import { MainMenu } from "@/components/menu/MainMenu";

export default function HomePage() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && <IntroLoader onFinish={() => setIntroDone(true)} />}
      <MainMenu />
    </>
  );
}
