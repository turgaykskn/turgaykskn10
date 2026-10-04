import {Composition} from "remotion";
import {LogoFootball} from "./LogoFootball/LogoFootball";
import {logoFootballSchema} from "./LogoFootball/types";

export const RemotionRoot: React.FC = () => {
  return (
    <>
<Composition
        id="LogoFootball"
        component={LogoFootball}
        schema={logoFootballSchema}
        // 60 s game + 2 s final score screen
        durationInFrames={1860}
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
    </>
  );
};
