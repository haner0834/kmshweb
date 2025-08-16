import { Suspense, type ComponentType } from "react";

type LazyIconProps = {
  icon: ComponentType<any>;
  fallback?: React.ReactNode;
} & React.SVGProps<SVGSVGElement>;

export default function LazyIcon({
  icon: Icon,
  fallback = null,
  ...props
}: LazyIconProps) {
  return (
    <Suspense fallback={fallback}>
      <Icon {...props} />
    </Suspense>
  );
}
