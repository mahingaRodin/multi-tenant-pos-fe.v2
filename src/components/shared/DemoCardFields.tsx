import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DemoCardState = {
  cardBrand: string;
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
};

const BRANDS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "CREDIT", label: "Credit card" },
  { value: "DEBIT", label: "Debit card" },
];

export function emptyDemoCard(): DemoCardState {
  return {
    cardBrand: "VISA",
    cardHolderName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  };
}

type Props = {
  value: DemoCardState;
  onChange: (next: DemoCardState) => void;
  title?: string;
};

/** Demo-only card capture — no real processor validation. */
export function DemoCardFields({ value, onChange, title = "Card payment (demo)" }: Props) {
  const [touched, setTouched] = useState(false);
  const set = (patch: Partial<DemoCardState>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <CreditCard className="size-4 text-primary" />
        {title}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Demo mode — any numbers work. Real card processing comes later.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="text-xs">Card type</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {BRANDS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => set({ cardBrand: b.value })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  value.cardBrand === b.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Name on card</Label>
          <Input
            className="mt-1"
            value={value.cardHolderName}
            onChange={(e) => set({ cardHolderName: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="Jane Doe"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs">Card number</Label>
          <Input
            className="mt-1 font-mono"
            value={value.cardNumber}
            onChange={(e) => set({ cardNumber: e.target.value.replace(/[^\d\s]/g, "").slice(0, 19) })}
            placeholder="4242 4242 4242 4242"
          />
        </div>
        <div>
          <Label className="text-xs">Expiry</Label>
          <Input
            className="mt-1 font-mono"
            value={value.cardExpiry}
            onChange={(e) => set({ cardExpiry: e.target.value.slice(0, 5) })}
            placeholder="MM/YY"
          />
        </div>
        <div>
          <Label className="text-xs">CVV</Label>
          <Input
            className="mt-1 font-mono"
            value={value.cardCvv}
            onChange={(e) => set({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder="123"
          />
        </div>
      </div>
      {touched && !value.cardNumber && (
        <p className="mt-2 text-xs text-amber-600">Enter a demo card number to continue.</p>
      )}
    </div>
  );
}
