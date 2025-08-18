import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import { Row } from "./Profile";
import {
  MessageCircleWarning,
  ChevronRight,
  Mail,
  CircleQuestionMark,
  Instagram,
  ShieldCheck,
  LifeBuoy,
  HeartHandshake,
  Github,
  Scale,
  Star,
  Gremo,
} from "@icons";

import moreData from "@shared/jsons/more.json";

const icons: Record<string, React.ReactNode> = {
  Instagram: <Instagram />,
  Mail: <Mail />,
  MessageCircleWarning: <MessageCircleWarning />,
  Star: <Star />,
  CircleQuestionMark: <CircleQuestionMark />,
  LifeBuoy: <LifeBuoy />,
  ShieldCheck: <ShieldCheck />,
  Gremo: <img src={Gremo} className="w-6 rounded-full" />,
  GitHub: <Github />,
  Scale: <Scale />,
  HeartHandshake: <HeartHandshake />,
};

export const Link = ({
  icon,
  title,
  link,
}: {
  icon?: React.ReactNode;
  title?: string;
  link?: string;
}) => {
  return (
    <li>
      <a href={link}>
        <Row
          icon={icon}
          title={title}
          value={<ChevronRight className="w-6 h-6" />}
        />
      </a>
    </li>
  );
};

const More = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("更多");
  }, []);

  return (
    <div className="min-h-screen bg-base-300 pt-16">
      <ul className="pt-4 mx-auto w-full max-w-xl">
        {Object.entries(moreData).map(([sectionTitle, links]) => (
          <div key={sectionTitle}>
            <SectionTitle title={sectionTitle} />
            <Section
              content={
                <>
                  {(links as any[]).map((item, i) => (
                    <Link
                      key={i}
                      icon={icons[item.icon]}
                      title={item.title}
                      link={item.link}
                    />
                  ))}
                </>
              }
            />
          </div>
        ))}

        <p className="mt-20 flex justify-center text-center text-xs opacity-40">
          © 2025 林禹澔. All rights reserved.
        </p>
      </ul>
    </div>
  );
};

export default More;
