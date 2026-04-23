import { Category } from "@/data/products";

interface CategoryFilterProps {
  categories: Category[];
  active: Category;
  onChange: (c: Category) => void;
}

const CategoryFilter = ({ categories, active, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 border-y border-border py-5">
      {categories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`relative px-4 py-2 text-[11px] tracking-luxe uppercase transition-colors duration-300 ${
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
            <span
              className={`absolute left-1/2 -translate-x-1/2 bottom-0 h-px bg-accent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive ? "w-6" : "w-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
