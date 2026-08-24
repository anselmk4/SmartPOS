"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Lock } from "lucide-react";

export interface CaptchaValidationState {
  isValid: boolean;
  captchaToken: string;
  captchaAnswer: string;
  honeypot: string;
}

interface CaptchaChallengeProps {
  onValidationChange: (state: CaptchaValidationState) => void;
  className?: string;
}

export function CaptchaChallenge({ onValidationChange, className = "" }: CaptchaChallengeProps) {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operator, setOperator] = useState<"+" | "-" | "×">("+");
  const [expectedAnswer, setExpectedAnswer] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [honeypotValue, setHoneypotValue] = useState<string>("");
  const [isRotating, setIsRotating] = useState(false);

  // Generate a fresh random challenge
  const generateChallenge = useCallback(() => {
    setIsRotating(true);
    const ops: Array<"+" | "-" | "×"> = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1 = 0;
    let n2 = 0;
    let expected = 0;

    if (op === "+") {
      n1 = Math.floor(Math.random() * 12) + 2; // 2 to 13
      n2 = Math.floor(Math.random() * 9) + 1; // 1 to 9
      expected = n1 + n2;
    } else if (op === "-") {
      n1 = Math.floor(Math.random() * 15) + 6; // 6 to 20
      n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
      expected = n1 - n2;
    } else {
      // multiplication
      n1 = Math.floor(Math.random() * 6) + 2; // 2 to 7
      n2 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      expected = n1 * n2;
    }

    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setExpectedAnswer(expected);
    setUserAnswer("");

    // Create a client token for verification
    const token = typeof window !== "undefined"
      ? btoa(JSON.stringify({ n1, n2, op, expected, timestamp: Date.now() }))
      : "";
    setCaptchaToken(token);

    onValidationChange({
      isValid: false,
      captchaToken: token,
      captchaAnswer: "",
      honeypot: honeypotValue,
    });

    setTimeout(() => setIsRotating(false), 400);
  }, [honeypotValue, onValidationChange]);

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleAnswerChange = (val: string) => {
    const clean = val.trim();
    setUserAnswer(clean);
    const numericAns = parseInt(clean, 10);
    const isValid = !isNaN(numericAns) && numericAns === expectedAnswer && honeypotValue.length === 0;

    onValidationChange({
      isValid,
      captchaToken,
      captchaAnswer: clean,
      honeypot: honeypotValue,
    });
  };

  const isAnswered = userAnswer.length > 0;
  const isCorrect = !isNaN(parseInt(userAnswer, 10)) && parseInt(userAnswer, 10) === expectedAnswer;

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        isAnswered && isCorrect
          ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20"
          : isAnswered && !isCorrect
          ? "bg-rose-50/60 border-rose-200"
          : "bg-slate-50 border-slate-200"
      } ${className}`}
    >
      {/* Anti-bot Honeypot field (hidden from humans, trapped bots fill it) */}
      <div style={{ display: "none", position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="website_url_hp">Ne pas remplir ce champ si vous êtes humain</label>
        <input
          type="text"
          id="website_url_hp"
          name="website_url_hp"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValue}
          onChange={(e) => {
            setHoneypotValue(e.target.value);
            onValidationChange({
              isValid: false,
              captchaToken,
              captchaAnswer: userAnswer,
              honeypot: e.target.value,
            });
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <ShieldCheck className={`w-4 h-4 ${isCorrect ? "text-emerald-600" : "text-blue-600"}`} />
          <span>Vérification Anti-Robot (Humain) *</span>
        </div>
        <button
          type="button"
          onClick={generateChallenge}
          title="Générer un autre calcul"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors flex items-center gap-1 text-[11px] font-semibold"
        >
          <RefreshCw className={`w-3 h-3 ${isRotating ? "animate-spin text-blue-600" : ""}`} />
          <span className="hidden sm:inline">Changer</span>
        </button>
      </div>

      {/* Challenge Body */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Visual Math Challenge Box */}
        <div className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center gap-2 select-none shrink-0 font-mono text-sm sm:text-base font-extrabold text-slate-800 tracking-wider">
          <span className="text-blue-600">{num1}</span>
          <span className="text-slate-400">{operator}</span>
          <span className="text-indigo-600">{num2}</span>
          <span className="text-slate-400">=</span>
          <span className="text-slate-300 font-normal">?</span>
        </div>

        {/* Input */}
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Réponse"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className={`w-full py-2.5 px-3 rounded-xl border text-sm font-mono font-bold text-center focus:bg-white outline-none transition-all ${
              isAnswered && isCorrect
                ? "border-emerald-500 bg-white text-emerald-800 ring-2 ring-emerald-500/20"
                : isAnswered && !isCorrect
                ? "border-rose-400 bg-white text-rose-700"
                : "border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {isAnswered && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {isCorrect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Helper feedback text */}
      <div className="mt-1.5 flex items-center gap-1 text-[11px]">
        {isAnswered && isCorrect ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vérification validée avec succès</span>
          </span>
        ) : isAnswered && !isCorrect ? (
          <span className="text-rose-600 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Résultat incorrect, veuillez recalculer</span>
          </span>
        ) : (
          <span className="text-slate-500 font-medium">
            Résolvez ce calcul simple pour prouver que vous n'êtes pas un robot.
          </span>
        )}
      </div>
    </div>
  );
}
