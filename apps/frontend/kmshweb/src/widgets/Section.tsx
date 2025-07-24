type SectionProps = {
  title?: string;
  itemTitles?: string[];
  content: React.ReactNode;
};

const Section = ({ title = "", itemTitles = [], content }: SectionProps) => {
  return (
    <li
      key={title}
      className="bg-base-100 mx-4 px-4 py-2 pe-6 rounded-2xl shadow-sm transition-all duration-300 max-w-2xl"
    >
      {title && (
        <div className="flex items-center mt-2">
          <div className="w-full flex items-center">
            <div className="w-3 h-3 rounded-2xl bg-primary mx-1" />
            <div className="whitespace-nowrap">{title}</div>
          </div>

          {itemTitles.map((item) => {
            return (
              <div className="uppercase text-xs font-semibold opacity-50 w-full whitespace-nowrap text-end">
                {item}
              </div>
            );
          })}
        </div>
      )}

      <ul className="space-y-10">{content}</ul>
    </li>
  );
};

export default Section;
