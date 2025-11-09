// components/ui/slider.tsx
import React, { FC } from "react";

interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export const Slider: FC<SliderProps> = ({
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(Number(e.target.value));
  };

  return (
    <input
      type="range"
      className="custom-slider"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
    />
  );
};

export default Slider;
