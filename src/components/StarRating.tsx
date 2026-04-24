import { Star } from "lucide-react";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}

const StarRating = ({ value, onChange, size = 18, readOnly = false }: Props) => {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform p-0.5`}
            aria-label={`${n} stars`}
          >
            <Star
              className={filled ? "fill-accent text-accent" : "text-muted-foreground/40"}
              style={{ width: size, height: size }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
