// Standalone entry for rendering only the SMF Grup reel:
//   npx remotion render src/smf-index.ts SmfReel out/smf-grup-reel.mp4
import "./index.css";
import React from "react";
import { Composition, registerRoot } from "remotion";
import { SmfReel } from "./SmfReel";

const Root: React.FC = () =>
  React.createElement(Composition, {
    id: "SmfReel",
    component: SmfReel,
    durationInFrames: 450,
    fps: 30,
    width: 1080,
    height: 1920,
  });

registerRoot(Root);
