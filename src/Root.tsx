import "./index.css";
import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { OracalReel } from "./OracalReel";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { LogoFootball } from "./LogoFootball/LogoFootball";
import { logoFootballSchema } from "./LogoFootball/types";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="OracalReel"
        component={OracalReel}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LogoFootball"
        component={LogoFootball}
        schema={logoFootballSchema}
        // 60 s game (0' → 90+3') + 3.5 s final score screen
        durationInFrames={1905}
        fps={30}
        width={1080}
        height={1920}
        // Teams can be edited in Studio's Props panel, or here.
        // Logo paths are relative to the public/ folder.
        defaultProps={{
          homeTeam: {
            name: "FENERBAHÇE",
            logo: "logos/fenerbahce.png ",
            primaryColor: "#001bff",
            secondaryColor: "#fffd00",
          },
          awayTeam: {
            name: "GALATASARAY",
            logo: "logos/galatasaray.png",
            primaryColor: "#ff0000",
            secondaryColor: "#ddff00",
          },
          gameSeed: "match-1791027525188",
        }}
      />
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

    </>
  );
};
