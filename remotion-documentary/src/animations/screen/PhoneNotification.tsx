import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface PhoneNotificationProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  title?: string;
  subtitle?: string;
  intensity?: number;
}

export const PhoneNotification: React.FC<PhoneNotificationProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  title = "New Message",
  subtitle = "Message received from Alex",
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const frame = useCurrentFrame();
  const translateY = (frame % 1000) / 1000;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top - 20 * translateY}%`,
          width: `${w}%`,
          height: `${h + 20}%`,
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.9)",
          borderRadius: "12px",
          border: "1px solid #FF3B30",
          color: "#FF3B30",
          fontFamily: "SF Pro Rounded, system-ui, sans-serif",
        }}
      >
        <div style={{ padding: 8, fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>{subtitle}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};