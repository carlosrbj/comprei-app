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

// Fallback tags based on establishment name (when items have no categories)
const ESTABLISHMENT_TAGS: { keywords: string[]; tags: TagInfo[] }[] = [
    {
        keywords: ['atacad', 'assaí', 'makro', 'atacarejo'],
        tags: [
            { emoji: '🥩', label: 'Alimentação', color: COLORS.PRIMARY },
            { emoji: '🧹', label: 'Limpeza', color: COLORS.CHART_BLUE },
            { emoji: '🧴', label: 'Higiene', color: COLORS.CHART_PURPLE },
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
    {
        keywords: ['posto', 'combustível'],
        tags: [{ emoji: '⛽', label: 'Combustível', color: COLORS.CHART_BLUE }],
    },
];

const DEFAULT_TAGS: TagInfo[] = [
    { emoji: '🛒', label: 'Supermercado', color: COLORS.PRIMARY },
];

function getStoreEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('atacad') || lower.includes('assaí') || lower.includes('makro')) return '🏭';
    if (lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('drogaria') || lower.includes('droga')) return '💊';
    if (lower.includes('padaria') || lower.includes('panific')) return '🥖';
    if (lower.includes('hortifruti') || lower.includes('feira') || lower.includes('sacolão')) return '🌿';
    if (lower.includes('posto') || lower.includes('combustível')) return '⛽';
    return '🛒';
}

function getFallbackTags(name: string): TagInfo[] {
    const lower = name.toLowerCase();
    for (const entry of ESTABLISHMENT_TAGS) {
        if (entry.keywords.some((kw) => lower.includes(kw))) {
            return entry.tags;
        }
    }
    return DEFAULT_TAGS;
}

/** Extract unique category tags from invoice items (real data from API) */
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
    const formattedDate = isToday
        ? `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
    }).format(invoice.totalValue);

    const emoji = getStoreEmoji(invoice.establishmentName);
    const itemCount = invoice.items?.length ?? 0;

    // Use real categories from items if available, otherwise fallback to heuristic
    const tags = useMemo(() => {
        const real = getRealCategoryTags(invoice);
        return real.length > 0 ? real.slice(0, 4) : getFallbackTags(invoice.establishmentName);
    }, [invoice]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            {/* Top row: store info + value */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: COLORS.PRIMARY_LIGHT,
                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                }}>
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.TEXT }} numberOfLines={1}>
                        {invoice.establishmentName}
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                        {formattedDate}{itemCount > 0 ? ` · ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}` : ''}
                    </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.TEXT }}>
                    {formattedValue}
                </Text>
            </View>

            {/* Category tags */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {tags.map((tag) => (
                    <View
                        key={tag.label}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: `${tag.color}14`,
                            borderRadius: 100,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                        }}
                    >
                        <Text style={{ fontSize: 11 }}>{tag.emoji}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: tag.color }}>
                            {tag.label}
                        </Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
}
