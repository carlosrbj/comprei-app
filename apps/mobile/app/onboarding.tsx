import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OnboardingSlide } from '../src/components/onboarding/OnboardingSlide';
import { DemoScanner } from '../src/components/onboarding/DemoScanner';
import { PermissionRequest } from '../src/components/onboarding/PermissionRequest';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { analyticsService } from '../src/services/analytics';
import { COLORS } from '../src/constants/colors';

const { width } = Dimensions.get('window');

const FEATURE_SLIDES = [
    {
        title: 'Controle Real dos Seus Gastos',
        description: 'Escaneie o QR code das notas fiscais e veja exatamente onde seu dinheiro está indo.',
        emoji: '📊',
        accentColor: COLORS.PRIMARY,
    },
    {
        title: 'Categorização Automática',
        description: 'IA identifica cada produto e categoriza automaticamente. Sem trabalho manual.',
        emoji: '🤖',
        accentColor: COLORS.SECONDARY,
    },
    {
        title: 'Liberdade de Sexta',
        description: 'Toda sexta receba quanto você economizou e dicas de como aproveitar bem o fim de semana.',
        emoji: '🍺',
        accentColor: COLORS.ACCENT,
    },
];

// Page indexes
const SLIDE_COUNT = FEATURE_SLIDES.length;
const PAGE_DEMO = SLIDE_COUNT;        // 3
const PAGE_CAMERA = SLIDE_COUNT + 1;  // 4
const PAGE_NOTIFS = SLIDE_COUNT + 2;  // 5
const TOTAL_PAGES = SLIDE_COUNT + 3;  // 6

export default function OnboardingScreen() {
    const scrollRef = useRef<ScrollView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const { setCompleted, setCurrentStep, setSkipped } = useOnboardingStore();
    const insets = useSafeAreaInsets();

    function goToPage(page: number) {
        scrollRef.current?.scrollTo({ x: page * width, animated: true });
    }

    function handleNext() {
        const next = currentPage + 1;
        if (next < TOTAL_PAGES) goToPage(next);
    }

    function handleSkip() {
        analyticsService.trackOnboarding(currentPage, 'skip');
        setSkipped(true);
        setCompleted(true);
        router.replace('/(app)');
    }

    function handleComplete() {
        analyticsService.trackOnboarding(TOTAL_PAGES, 'complete');
        setCompleted(true);
        setCurrentStep(TOTAL_PAGES);
        router.replace('/(app)');
    }

    function handlePageChange(page: number) {
        setCurrentPage(page);
        setCurrentStep(page);
        analyticsService.trackOnboarding(page, 'view');
    }

    const isLastPermission = currentPage >= PAGE_NOTIFS;
    const isPermissionPage = currentPage >= PAGE_CAMERA;
    const isDemoPage = currentPage === PAGE_DEMO;
    const isSlide = currentPage < SLIDE_COUNT;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

            {/* Skip button */}
            {!isPermissionPage && !isLastPermission && (
                <TouchableOpacity
                    onPress={handleSkip}
                    style={{
                        position: 'absolute',
                        top: insets.top + 16,
                        right: 20,
                        zIndex: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 100,
                        backgroundColor: COLORS.BORDER,
                    }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.TEXT_MUTED }}>
                        Pular
                    </Text>
                </TouchableOpacity>
            )}

            {/* Pager */}
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                scrollEnabled={isSlide}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const page = Math.round(e.nativeEvent.contentOffset.x / width);
                    if (page !== currentPage) handlePageChange(page);
                }}
                style={{ flex: 1 }}
                contentContainerStyle={{ alignItems: 'center' }}
            >
                {/* Feature slides */}
                {FEATURE_SLIDES.map((slide, i) => (
                    <View key={i} style={{ width, flex: 1, paddingTop: insets.top + 48 }}>
                        <OnboardingSlide {...slide} />
                    </View>
                ))}

                {/* Demo scanner */}
                <View key="demo" style={{
                    width,
                    flex: 1,
                    paddingTop: insets.top + 48,
                    alignItems: 'center',
                }}>
                    <Text style={{
                        fontSize: 26, fontWeight: '800', color: COLORS.TEXT,
                        textAlign: 'center', paddingHorizontal: 40,
                        letterSpacing: -0.5, marginBottom: 8,
                    }}>
                        Vamos Testar?
                    </Text>
                    <Text style={{
                        fontSize: 15, color: COLORS.TEXT_MUTED,
                        textAlign: 'center', paddingHorizontal: 40, marginBottom: 8,
                    }}>
                        Veja como é rápido escanear uma nota
                    </Text>
                    <DemoScanner onScanComplete={handleNext} />
                </View>

                {/* Camera permission */}
                <View key="camera" style={{ width, flex: 1, paddingTop: insets.top + 24 }}>
                    <PermissionRequest
                        type="camera"
                        onGranted={handleNext}
                        onSkip={handleNext}
                    />
                </View>

                {/* Notifications permission */}
                <View key="notifications" style={{ width, flex: 1, paddingTop: insets.top + 24 }}>
                    <PermissionRequest
                        type="notifications"
                        onGranted={handleComplete}
                        onSkip={handleComplete}
                    />
                </View>
            </ScrollView>

            {/* Bottom bar */}
            <View style={{
                paddingHorizontal: 24,
                paddingBottom: insets.bottom + 24,
                paddingTop: 16,
            }}>
                {/* Progress dots */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 20,
                }}>
                    {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                        <View
                            key={i}
                            style={{
                                height: 6,
                                borderRadius: 3,
                                width: i === currentPage ? 24 : 6,
                                backgroundColor: i === currentPage
                                    ? COLORS.PRIMARY
                                    : i < currentPage
                                    ? `${COLORS.PRIMARY}60`
                                    : COLORS.BORDER,
                            }}
                        />
                    ))}
                </View>

                {/* Next button — only on slides */}
                {isSlide && (
                    <TouchableOpacity
                        onPress={handleNext}
                        style={{
                            backgroundColor: COLORS.PRIMARY,
                            paddingVertical: 16,
                            borderRadius: 14,
                            alignItems: 'center',
                            shadowColor: COLORS.PRIMARY,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 5,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                            {currentPage === SLIDE_COUNT - 1 ? 'Ver Demo' : 'Continuar'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
