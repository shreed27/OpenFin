"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Key, Download, Eye, EyeOff, ArrowLeft, Copy, Check } from "lucide-react";

import { useWalletStatus, useCreateWallet, useImportWallet, useUnlockWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { copyToClipboard } from "@/lib/utils";

type Step = "choice" | "create-password" | "show-mnemonic" | "import" | "unlock";

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: status } = useWalletStatus();

  const [step, setStep] = useState<Step>("choice");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [importMnemonic, setImportMnemonic] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const createWalletMutation = useCreateWallet();
  const importWalletMutation = useImportWallet();
  const unlockMutation = useUnlockWallet();

  useEffect(() => {
    if (searchParams.get("unlock") === "true" && status?.has_wallet) {
      setStep("unlock");
    }
  }, [searchParams, status]);

  const handleCreateWallet = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const result = await createWalletMutation.mutateAsync(password);
      setMnemonic(result.mnemonic);
      setStep("show-mnemonic");
    } catch (err: any) {
      setError(err.message || "Failed to create wallet");
    }
  };

  const handleImportWallet = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const words = importMnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError("Please enter a valid 12 or 24 word mnemonic");
      return;
    }

    try {
      await importWalletMutation.mutateAsync({
        mnemonic: importMnemonic.trim(),
        password,
      });
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to import wallet");
    }
  };

  const handleUnlock = async () => {
    try {
      await unlockMutation.mutateAsync(password);
      router.push("/");
    } catch (err: any) {
      setError("Invalid password");
    }
  };

  const handleCopyMnemonic = async () => {
    await copyToClipboard(mnemonic.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md"
        >
          {step === "choice" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Multi-Chain Wallet</CardTitle>
                <CardDescription>
                  Create a new wallet or import an existing one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full h-14"
                  onClick={() => setStep("create-password")}
                >
                  <Key className="mr-2 h-5 w-5" />
                  Create New Wallet
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-14"
                  onClick={() => setStep("import")}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Import Existing Wallet
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "create-password" && (
            <Card>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2"
                  onClick={() => setStep("choice")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <CardTitle>Create Password</CardTitle>
                <CardDescription>
                  This password encrypts your wallet. Store it safely.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleCreateWallet}
                  disabled={createWalletMutation.isPending}
                >
                  {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "show-mnemonic" && (
            <Card>
              <CardHeader>
                <CardTitle>Your Recovery Phrase</CardTitle>
                <CardDescription className="text-destructive">
                  Write these words down and store them safely. Never share them!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 p-4 bg-secondary rounded-lg">
                  {mnemonic.map((word, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">
                        {i + 1}.
                      </span>
                      <span className="font-mono text-sm">{word}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyMnemonic}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button className="w-full" onClick={() => router.push("/")}>
                  I&apos;ve Saved My Phrase
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "import" && (
            <Card>
              <CardHeader>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2"
                  onClick={() => setStep("choice")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <CardTitle>Import Wallet</CardTitle>
                <CardDescription>
                  Enter your 12 or 24 word recovery phrase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  className="w-full h-24 p-3 rounded-md border bg-background text-sm resize-none"
                  placeholder="Enter your recovery phrase..."
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleImportWallet}
                  disabled={importWalletMutation.isPending}
                >
                  {importWalletMutation.isPending ? "Importing..." : "Import Wallet"}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "unlock" && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Unlock Wallet</CardTitle>
                <CardDescription>
                  Enter your password to unlock your wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleUnlock}
                  disabled={unlockMutation.isPending}
                >
                  {unlockMutation.isPending ? "Unlocking..." : "Unlock"}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
