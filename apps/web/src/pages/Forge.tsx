import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../hooks/useAgent';
import { useInventory, useItemCatalog, useBuyItem, useUseItem } from '../hooks/useInventory';
import type { ItemDef, InventoryItem } from '../hooks/useInventory';

const TYPE_CONFIG = {
  consumable: { color: 'verdant', label: 'Consumable', icon: '\u{1F9EA}' },
  equipment: { color: 'arcane', label: 'Equipment', icon: '\u{1F6E1}\u{FE0F}' },
  cosmetic: { color: 'ember', label: 'Cosmetic', icon: '\u{2728}' },
} as const;

/* ---------- Confetti particles for purchase animation ---------- */
function PurchaseConfetti({ color }: { color: string }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 40 + Math.random() * 30;
    return {
      id: i,
      x: Math.cos(rad) * dist,
      y: Math.sin(rad) * dist,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute h-1.5 w-1.5 rounded-full bg-${color}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ---------- Shop Item Card ---------- */
function ShopItemCard({
  item,
  agentGold,
  agentLevel,
  onBuy,
  isBuying,
  justBought,
}: {
  item: ItemDef;
  agentGold: number;
  agentLevel: number;
  onBuy: (itemId: string) => void;
  isBuying: boolean;
  justBought: boolean;
}) {
  const typeConf = TYPE_CONFIG[item.type];
  const canAfford = agentGold >= item.price;
  const levelOk = agentLevel >= item.levelRequired;
  const canBuy = canAfford && levelOk && !isBuying;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border border-${typeConf.color}/20 bg-void-light p-4`}
    >
      {/* Purchase confetti */}
      <AnimatePresence>
        {justBought && <PurchaseConfetti color={typeConf.color} />}
      </AnimatePresence>

      {/* Scale pop on purchase */}
      <AnimatePresence>
        {justBought && (
          <motion.div
            initial={{ scale: 1.15, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 z-10 rounded-xl border-2 border-${typeConf.color}`}
          />
        )}
      </AnimatePresence>

      {/* Type badge */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 rounded-md border border-${typeConf.color}/30 bg-${typeConf.color}/10 px-2 py-0.5 font-mono text-[10px] uppercase text-${typeConf.color}-light`}
        >
          {typeConf.icon} {typeConf.label}
        </span>
        {item.levelRequired > 1 && (
          <span className={`font-mono text-[10px] ${levelOk ? 'text-steel-light' : 'text-rift-light'}`}>
            Lv {item.levelRequired}+
          </span>
        )}
      </div>

      <h3 className="font-display text-sm font-bold tracking-wider text-parchment uppercase">
        {item.name}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-ash">
        {item.description}
      </p>
      <p className="mt-1 font-mono text-[10px] text-steel-light">
        Effect: {item.effect}
      </p>

      {/* Price and buy */}
      <div className="mt-3 flex items-center justify-between border-t border-steel/30 pt-3">
        <span
          className={`font-mono text-sm font-bold ${canAfford ? 'text-ember-light' : 'text-rift-light'}`}
        >
          {item.price} Gold
        </span>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onBuy(item.id)}
          disabled={!canBuy}
          className={`rounded-lg border px-4 py-1.5 font-display text-xs tracking-wider uppercase transition-all ${
            canBuy
              ? `border-${typeConf.color}/50 bg-${typeConf.color}/10 text-${typeConf.color}-light hover:bg-${typeConf.color}/20`
              : 'cursor-not-allowed border-steel bg-void-lighter text-steel-light opacity-50'
          }`}
        >
          {isBuying ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              Buying...
            </motion.span>
          ) : !levelOk ? (
            'Locked'
          ) : (
            'Buy'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------- Inventory Item Row ---------- */
function InventoryItemRow({
  item,
  onUse,
  isUsing,
}: {
  item: InventoryItem;
  onUse: (id: string) => void;
  isUsing: boolean;
}) {
  const typeConf = TYPE_CONFIG[item.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 rounded-lg border border-${typeConf.color}/20 bg-void-light px-4 py-3`}
    >
      {/* Icon area */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-${typeConf.color}/30 bg-${typeConf.color}/10 text-lg`}
      >
        {typeConf.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-xs font-bold tracking-wider text-parchment uppercase">
            {item.name}
          </h3>
          {item.equipped && (
            <span className="shrink-0 rounded-md border border-arcane/40 bg-arcane/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-arcane-light">
              Equipped
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-ash">{item.description}</p>
        <p className="font-mono text-[10px] text-steel-light">
          Qty: {item.quantity}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {item.type === 'consumable' && item.quantity > 0 && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onUse(item.id)}
            disabled={isUsing}
            className="rounded-lg border border-verdant/50 bg-verdant/10 px-3 py-1.5 font-display text-xs tracking-wider text-verdant-light uppercase transition-colors hover:bg-verdant/20 disabled:opacity-50"
          >
            {isUsing ? '...' : 'Use'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- Main Forge Component ---------- */
export function Forge() {
  const { data: agent, isLoading: agentLoading } = useAgent();
  const { data: inventoryData, isLoading: inventoryLoading } = useInventory();
  const { data: catalogData, isLoading: catalogLoading } = useItemCatalog();
  const buyItem = useBuyItem();
  const useItem = useUseItem();

  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [recentlyBought, setRecentlyBought] = useState<string | null>(null);

  const catalog = catalogData?.items ?? [];
  const inventory = inventoryData?.items ?? [];

  const handleBuy = useCallback(
    (itemId: string) => {
      buyItem.mutate(
        { itemId },
        {
          onSuccess: () => {
            setRecentlyBought(itemId);
            setTimeout(() => setRecentlyBought(null), 1000);
          },
        },
      );
    },
    [buyItem],
  );

  const handleUse = useCallback(
    (inventoryItemId: string) => {
      useItem.mutate({ inventoryItemId });
    },
    [useItem],
  );

  const isLoading = agentLoading || inventoryLoading || catalogLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-4"
    >
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
              The Forge
            </h1>
            <p className="mt-1 font-mono text-sm tracking-wide text-ash">
              // Spend Gold, Gain Power
            </p>
          </div>

          {/* Gold display */}
          {agent && (
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-ember/30 bg-ember/10 px-3 py-1.5">
              <span className="text-base">&#x1FA99;</span>
              <span className="font-mono text-sm font-bold text-ember-light">
                {agent.gold} Gold
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-ember via-steel to-transparent" />
      </header>

      {/* Tab Switcher */}
      <div className="mb-5 flex gap-2">
        {[
          { id: 'shop' as const, label: 'Shop', icon: '\u{1F6D2}', count: catalog.length },
          { id: 'inventory' as const, label: 'Inventory', icon: '\u{1F392}', count: inventory.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-all ${
                isActive
                  ? 'border-ember bg-ember/10'
                  : 'border-steel bg-void-lighter hover:border-steel-light'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span
                className={`font-display text-xs tracking-wider uppercase ${
                  isActive ? 'text-ember-light' : 'text-ash'
                }`}
              >
                {tab.label}
              </span>
              <span className="font-mono text-[10px] text-steel-light">
                [{tab.count}]
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-xs text-steel-light"
          >
            Loading forge data...
          </motion.p>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          {activeTab === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Shop section header */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">&#x2692;&#xFE0F;</span>
                <h2 className="font-display text-sm tracking-widest text-ember-light uppercase">
                  Item Catalog
                </h2>
                <div className="ml-2 h-px flex-1 bg-gradient-to-r from-ember/30 to-transparent" />
              </div>

              {catalog.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <span className="text-4xl">&#x1F528;</span>
                  <p className="font-display text-sm tracking-wider text-ember-light uppercase">
                    No schematics available
                  </p>
                  <p className="max-w-xs text-xs text-ash">
                    New items will become available as you level up and progress through your journey.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {catalog.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      agentGold={agent?.gold ?? 0}
                      agentLevel={agent?.level ?? 1}
                      onBuy={handleBuy}
                      isBuying={
                        buyItem.isPending &&
                        buyItem.variables?.itemId === item.id
                      }
                      justBought={recentlyBought === item.id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Inventory section header */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">&#x1F392;</span>
                <h2 className="font-display text-sm tracking-widest text-arcane-light uppercase">
                  Your Inventory
                </h2>
                <div className="ml-2 h-px flex-1 bg-gradient-to-r from-arcane/30 to-transparent" />
              </div>

              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <span className="text-4xl">&#x1F4E6;</span>
                  <p className="font-display text-sm tracking-wider text-ash uppercase">
                    Your inventory is empty
                  </p>
                  <p className="max-w-xs text-xs text-ash">
                    Visit the shop to acquire gear.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('shop')}
                    className="mt-2 rounded-lg border border-ember/40 bg-ember/10 px-4 py-2 font-display text-xs tracking-wider text-ember-light uppercase hover:bg-ember/20"
                  >
                    Browse Shop
                  </motion.button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {inventory.map((item) => (
                    <InventoryItemRow
                      key={item.id}
                      item={item}
                      onUse={handleUse}
                      isUsing={
                        useItem.isPending &&
                        useItem.variables?.inventoryItemId === item.id
                      }
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Error toasts */}
      <AnimatePresence>
        {(buyItem.isError || useItem.isError) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 bottom-4 left-4 z-50 rounded-lg border border-rift/30 bg-rift/10 px-4 py-3"
          >
            <p className="text-xs text-rift-light">
              {buyItem.error?.message ?? useItem.error?.message ?? 'Something went wrong. Try again.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
