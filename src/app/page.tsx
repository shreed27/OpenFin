"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Wallet,
  Send,
  ArrowLeftRight,
  Image,
  Clock,
  Users,
  BookUser,
  Lock,
  Plus,
} from "lucide-react";

import { useWalletStatus, useAccounts, useSelectedAccountBalance, useLockWallet } from "@/hooks/useWallet";
import { useWalletStore } from "@/hooks/useWalletStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { truncateAddress, formatBalance } from "@/lib/utils";

export default function Dashboard() {
  const router = useRouter();
  const { data: status, isLoading: statusLoading } = useWalletStatus();
  const { data: accounts } = useAccounts();
  const { data: balance } = useSelectedAccountBalance();
  const { selectedAccount, selectAccount } = useWalletStore();
  const lockMutation = useLockWallet();

  useEffect(() => {
    if (!statusLoading && status) {
      if (!status.has_wallet) {
        router.push("/setup");
      } else if (!status.is_unlocked) {
        router.push("/setup?unlock=true");
      }
    }
  }, [status, statusLoading, router]);

  if (statusLoading || !status?.is_unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const navItems = [
    { icon: Send, label: "Send", href: "/send" },
    { icon: ArrowLeftRight, label: "Swap", href: "/swap" },
    { icon: Image, label: "NFTs", href: "/nfts" },
    { icon: Clock, label: "History", href: "/history" },
    { icon: BookUser, label: "Contacts", href: "/contacts" },
    { icon: Users, label: "Multi-sig", href: "/multisig" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Multi-Chain Wallet</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => lockMutation.mutate()}
          >
            <Lock className="h-4 w-4 mr-2" />
            Lock
          </Button>
        </div>

        {/* Account Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Accounts</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/accounts")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {accounts?.map((account) => (
                <motion.button
                  key={account.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectAccount(account)}
                  className={`flex-shrink-0 p-3 rounded-lg border transition-colors ${
                    selectedAccount?.id === account.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card hover:bg-accent border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        account.chain === "solana"
                          ? "bg-purple-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium">{account.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {truncateAddress(account.address)}
                  </div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        {selectedAccount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedAccount.chain === "solana" ? "SOL" : "ETH"} Balance
                  </p>
                  <p className="text-4xl font-bold">
                    {balance ? formatBalance(balance.native_balance) : "0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {truncateAddress(selectedAccount.address, 8)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation Grid */}
        <div className="grid grid-cols-3 gap-4">
          {navItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => router.push(item.href)}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Token Balances */}
        {balance && balance.tokens.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balance.tokens.map((token) => (
                  <div
                    key={token.address}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">
                        {token.symbol || truncateAddress(token.address)}
                      </p>
                      {token.name && (
                        <p className="text-sm text-muted-foreground">
                          {token.name}
                        </p>
                      )}
                    </div>
                    <p className="font-mono">
                      {formatBalance(token.ui_amount)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
