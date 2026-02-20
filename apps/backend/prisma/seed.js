"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CATEGORIES = [
    {
        name: 'Carnes e Proteínas',
        emoji: '🥩',
        color: '#E74C3C',
        keywords: ['carne', 'frango', 'peixe', 'bovina', 'suína', 'linguiça', 'costela', 'picanha', 'filé', 'tilápia', 'salmão', 'bacalhau', 'camarão', 'atum', 'presunto', 'salsicha', 'mortadela', 'acém', 'alcatra', 'chester', 'peru', 'sobrecoxa', 'coxa', 'peito de frango', 'coxinha da asa'],
    },
    {
        name: 'Laticínios e Frios',
        emoji: '🥛',
        color: '#3498DB',
        keywords: ['leite', 'queijo', 'iogurte', 'manteiga', 'margarina', 'requeijão', 'cream cheese', 'nata', 'creme de leite', 'mussarela', 'parmesão', 'coalho', 'ricota', 'cottage', 'danone', 'italac', 'vigor', 'batavo'],
    },
    {
        name: 'Frutas, Legumes e Verduras',
        emoji: '🥬',
        color: '#27AE60',
        keywords: ['alface', 'tomate', 'cebola', 'batata', 'cenoura', 'brócolis', 'couve', 'repolho', 'pimentão', 'banana', 'maçã', 'laranja', 'uva', 'melancia', 'mamão', 'abacaxi', 'morango', 'limão', 'manga', 'verdura', 'legume', 'fruta', 'hortifruti', 'alho', 'abóbora', 'chuchu', 'pepino'],
    },
    {
        name: 'Padaria e Confeitaria',
        emoji: '🍞',
        color: '#E67E22',
        keywords: ['pão', 'bolo', 'torta', 'biscoito', 'bolacha', 'croissant', 'sonho', 'rosca', 'brioche', 'integral', 'francês', 'forma', 'confeitaria', 'wickbold', 'pullman', 'bisnaguinha'],
    },
    {
        name: 'Bebidas Não-alcoólicas',
        emoji: '🥤',
        color: '#16A085',
        keywords: ['refrigerante', 'suco', 'água', 'chá', 'café', 'néctar', 'isotônico', 'energético', 'achocolatado', 'coca', 'pepsi', 'guaraná', 'sprite', 'fanta', 'del valle', 'maguary', 'nescafé', 'dolce gusto', 'capsula'],
    },
    {
        name: 'Bebidas Alcoólicas',
        emoji: '🍺',
        color: '#F39C12',
        keywords: ['cerveja', 'vinho', 'vodka', 'whisky', 'cachaça', 'gin', 'tequila', 'licor', 'espumante', 'champagne', 'aperitivo', 'destilado', 'brahma', 'skol', 'heineken', 'budweiser', 'antarctica', 'chopp'],
    },
    {
        name: 'Congelados e Semi-prontos',
        emoji: '🧊',
        color: '#5DADE2',
        keywords: ['congelado', 'lasanha', 'pizza', 'hambúrguer', 'nugget', 'semi-pronto', 'sorvete', 'picolé', 'açaí', 'kibon', 'sadia', 'perdigão', 'seara', 'empanado'],
    },
    {
        name: 'Higiene e Beleza',
        emoji: '🧴',
        color: '#9B59B6',
        keywords: ['shampoo', 'condicionador', 'sabonete', 'creme', 'desodorante', 'perfume', 'escova', 'pasta dental', 'fio dental', 'enxaguante', 'hidratante', 'protetor solar', 'maquiagem', 'absorvente', 'seda', 'pantene', 'dove', 'nivea', 'colgate', 'oral-b', 'gillette', 'barbeador'],
    },
    {
        name: 'Limpeza Doméstica',
        emoji: '🧹',
        color: '#1ABC9C',
        keywords: ['detergente', 'sabão', 'amaciante', 'alvejante', 'desinfetante', 'água sanitária', 'esponja', 'pano', 'vassoura', 'rodo', 'limpeza', 'multiuso', 'cloro', 'omo', 'ypê', 'pinho sol', 'veja', 'bombril', 'comfort', 'downy'],
    },
    {
        name: 'Bebê e Infantil',
        emoji: '👶',
        color: '#FF6B9D',
        keywords: ['fralda', 'lenço umedecido', 'papinha', 'bebê', 'infantil', 'mamadeira', 'chupeta', 'pomada', 'baby', 'huggies', 'pampers', 'turma da mônica', 'nestle baby'],
    },
    {
        name: 'Pet Shop',
        emoji: '🐾',
        color: '#795548',
        keywords: ['ração', 'pet', 'cachorro', 'gato', 'areia', 'petisco', 'coleira', 'pedigree', 'whiskas', 'golden', 'royal canin'],
    },
    {
        name: 'Farmácia e Saúde',
        emoji: '💊',
        color: '#E74C3C',
        keywords: ['remédio', 'medicamento', 'dipirona', 'paracetamol', 'omeprazol', 'vitamina', 'suplemento', 'curativo', 'band-aid', 'gaze', 'álcool', 'termômetro', 'dorflex', 'neosaldina', 'whey', 'creatina'],
    },
    {
        name: 'Snacks e Guloseimas',
        emoji: '🍿',
        color: '#F1C40F',
        keywords: ['chocolate', 'bala', 'chiclete', 'salgadinho', 'chips', 'pipoca', 'amendoim', 'castanha', 'wafer', 'trufa', 'doce', 'snack', 'guloseima', 'sobremesa', 'ruffles', 'doritos', 'cheetos', 'lacta', 'nestlé', 'trident', 'halls'],
    },
    {
        name: 'Temperos e Conservas',
        emoji: '🧂',
        color: '#95A5A6',
        keywords: ['sal', 'açúcar', 'óleo', 'azeite', 'vinagre', 'molho', 'ketchup', 'maionese', 'mostarda', 'tempero', 'pimenta', 'orégano', 'conserva', 'picles', 'azeitona', 'hellmanns', 'heinz', 'sazon', 'knorr', 'shoyu', 'soya'],
    },
    {
        name: 'Grãos e Cereais',
        emoji: '🫙',
        color: '#D4AC6E',
        keywords: ['arroz', 'feijão', 'macarrão', 'farinha', 'fubá', 'aveia', 'granola', 'cereal', 'lentilha', 'grão', 'quinoa', 'chia', 'linhaça', 'trigo', 'espaguete', 'penne', 'fusilli', 'massa', 'miojo', 'nissin', 'renata', 'barilla'],
    },
];
async function main() {
    console.log('🌱 Seeding categories...');
    for (const cat of CATEGORIES) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: {
                emoji: cat.emoji,
                color: cat.color,
                keywords: cat.keywords,
            },
            create: cat,
        });
        console.log(`  ✓ ${cat.emoji} ${cat.name} (${cat.keywords.length} keywords)`);
    }
    console.log(`\n✅ Seed completed! ${CATEGORIES.length} categories created.`);
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map