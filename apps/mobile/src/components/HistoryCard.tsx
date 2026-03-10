import { View, Text, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { COLORS } from '../constants/colors';
import { Invoice, Category } from '../types';

interface HistoryCardProps {
    invoice: Invoice;
    onPress: () => void;
}

interface TagInfo {
    emoji: string;
    label: string;
    color: string;
}

const ESTABLISHMENT_TAGS: { keywords: string[]; tags: TagInfo[] }[] = [
    {
        keywords: ['atacad', 'assaí', 'makro', 'atacarejo'],
        tags: [
            { emoji: '🥩', label: 'Alimentação', color: COLORS.PRIMARY },
            { emoji: '🧹', label: 'Limpeza', color: COLORS.CHART_BLUE },
        ],
    },
    {
        keywords: ['farmácia', 'farmacia', 'drogaria', 'droga'],
        tags: [
            { emoji: '💊', label: 'Saúde', color: COLORS.DANGER },
            { emoji: '🧴', label: 'Higiene', color: COLORS.CHART_PURPLE },
        ],
    },
    {
        keywords: ['padaria', 'panific'],
        tags: [{ emoji: '🍞', label: 'Padaria', color: COLORS.SECONDARY }],
    },
    {
        keywords: ['hortifruti', 'feira', 'sacolão'],
        tags: [{ emoji: '🥬', label: 'Hortifruti', color: COLORS.PRIMARY }],
    },
];

const DEFAULT_TAGS: TagInfo[] = [
    { emoji: '🛒', label: 'Supermercado', color: COLORS.PRIMARY },
];

function getStoreEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('atacad') || lower.includes('assaí') || lower.includes('makro')) return '🏭';
    if (lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('drogaria')) return '💊';
    if (lower.includes('padaria') || lower.includes('panific')) return '🥖';
    if (lower.includes('hortifruti') || lower.includes('feira')) return '🌿';
    if (lower.includes('posto') || lower.includes('combustível')) return '⛽';
    return '🛒';
}

function getFallbackTags(name: string): TagInfo[] {
    const lower = name.toLowerCase();
    for (const entry of ESTABLISHMENT_TAGS) {
        if (entry.keywords.some(kw => lower.includes(kw))) return entry.tags;
    }
    return DEFAULT_TAGS;
}

function getRealCategoryTags(invoice: Invoice): TagInfo[] {
    if (!invoice.items?.length) return [];
    const seen = new Set<string>();
    const tags: TagInfo[] = [];
    for (const item of invoice.items) {
        const cat: Category | null | undefined = item.product?.category;
        if (cat && !seen.has(cat.id)) {
            seen.add(cat.id);
            tags.push({ emoji: cat.emoji, label: cat.name, color: cat.color });
        }
    }
    return tags;
}

export function HistoryCard({ invoice, onPress }: HistoryCardProps) {
    const date = new Date(invoice.date);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = (() => {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return date.toDateString() === y.toDateString();
    })();

    const formattedDate = isToday
        ? `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : isYesterday
        ? `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
    }).format(invoice.totalValue);

    const emoji = getStoreEmoji(invoice.establishmentName);
    const itemCount = invoice.items?.length ?? 0;

    const tags = useMemo(() => {
        const real = getRealCategoryTags(invoice);
        return (real.length > 0 ? real : getFallbackTags(invoice.establishmentName)).slice(0, 3);
    }, [invoice]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`${invoice.establishmentName}, ${formattedValue}, ${formattedDate}`}
            style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: COLORS.BORDER,
                overflow: 'hidden',
            }}
        >
            {/* Top row: store + value */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                <View style={{
                    width: 42, height: 42, borderRadius: 11,
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 12, flexShrink: 0,
                }}>
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </View>

                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        style={{ fontSize: 14, fontWeight: '700', color: COLORS.TEXT, lineHeight: 19 }}
                        numberOfLines={1}
                    >
                        {invoice.establishmentName}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                        {formattedDate}
                        {itemCount > 0 ? `  ·  ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ''}
                    </Text>
                </View>

                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.TEXT }}>
                    {formattedValue}
                </Text>
            </View>

            {/* Category tags */}
            {tags.length > 0 && (
                <View style={{
                    flexDirection: 'row',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingBottom: 12,
                }}>
                    {tags.map(tag => (
                        <View
                            key={tag.label}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                backgroundColor: `${tag.color}15`,
                                borderRadius: 100,
                                paddingHorizontal: 9,
                                paddingVertical: 3,
                            }}
                        >
                            <Text style={{ fontSize: 10 }}>{tag.emoji}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: tag.color }}>
                                {tag.label}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}
