import { Composition, registerRoot } from "remotion";
import "./index.css";
import { LogoFootballMatch } from "./LogoFootball/Match";
import { TOTAL_FRAMES } from "./LogoFootball/sim";

const Root: React.FC = () => (
  <Composition
    id="gulsuyu-sk-vs-bfa"
    component={LogoFootballMatch}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      // Fresh, unique seed generated for this match only
      gameSeed: "amator-arena-gulsuyu-sk-vs-bfa-8f4f58bc6267",
      home: {
        name: "Gülsuyu SK",
        short: "GSK",
        logo: "logos/gulsuyu-sk.png",
        color: "#e3001b",
        disc: "#ffffff",
      },
      away: {
        name: "BFA",
        short: "BFA",
        logo: "logos/bfa.png",
        color: "#ff8a00",
        disc: "#14100c",
      },
    }}
  />
);

registerRoot(Root);
