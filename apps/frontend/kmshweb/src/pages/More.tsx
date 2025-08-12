import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import { Row } from "./Profile";
import MsgCircleWarning from "@shared/icons/message-circle-warning.svg?react";
import ChevronRight from "@shared/icons/chevron_right.svg?react";
import Mail from "@shared/icons/mail.svg?react";
import Question from "@shared/icons/circle-question-mark.svg?react";
import Instagram from "@shared/icons/instagram.svg?react";
import ShieldCheck from "@shared/icons/shield-check.svg?react";
import LifeBuoy from "@shared/icons/life-buoy.svg?react";
import Handshake from "@shared/icons/heart-handshake.svg?react";
import GitHub from "@shared/icons/github.svg?react";
import Scale from "@shared/icons/scale.svg?react";
import LightBulb from "@shared/icons/lightbulb.svg?react";
import Gremo from "@shared/icons/gremo.png";

const Link = ({
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
  const { setNavbarButtonsByType } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
  }, []);

  // TODO: `guide`, `faq`, `report`, `feat-req`
  return (
    <div className="min-h-screen bg-base-300 pt-16">
      <ul>
        <SectionTitle title="聯絡與回饋" />
        <Section
          content={
            <>
              <Link
                icon={<Instagram />}
                title="Instagram"
                link="https://www.instagram.com/coffee_.roll?igsh=MWt0eGVub3B4aTV0Zw%3D%3D"
              />

              <Link
                icon={<Mail />}
                title="Email"
                link="mailto:coffeeroll901@gmail.com"
              />

              <Link
                icon={<MsgCircleWarning />}
                title="問題回報"
                link="report"
              />

              <Link icon={<LightBulb />} title="新功能許願" link="feat-req" />
            </>
          }
        />

        <SectionTitle title="使用" />
        <Section
          content={
            <>
              <Link icon={<Question />} title="常見問題" link="faq" />
              <Link icon={<LifeBuoy />} title="使用說明" link="guide" />
            </>
          }
        />

        <SectionTitle title="隱私" />
        <Section
          content={
            <>
              <Link
                icon={<ShieldCheck />}
                title="隱私政策"
                link="/privacy-policy.html"
              />
            </>
          }
        />

        <SectionTitle title="其他產品" />
        <Section
          content={
            <>
              <Link
                icon={<img src={Gremo} className="w-6 rounded-full" />}
                title="Gremo"
                link="https://apps.apple.com/tw/app/gremo/id6450648780"
              />
            </>
          }
        />

        <SectionTitle title="open source" />
        <Section
          content={
            <>
              <Link
                icon={<GitHub />}
                title="程式碼開源"
                link="https://github.com/haner0834/kmshweb"
              />

              <Link
                icon={<Scale />}
                title="開源授權（Licence）"
                link="https://github.com/haner0834/kmshweb/blob/main/LICENSE"
              />
            </>
          }
        />

        <SectionTitle title="當個好人" />
        <Section
          content={
            <>
              <Link icon={<Handshake />} title="贊助" link=":D" />
            </>
          }
        />

        <p className="mt-20 flex justify-center text-center text-xs opacity-40">
          © 2025 林禹澔. All rights reserved.
        </p>
      </ul>
    </div>
  );
};

export default More;
