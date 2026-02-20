import { View, Text, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

// Type-cast fix: reanimated's Animated.View/Text conflict with @types/react 18.3
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimView = Animated.View as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimText = Animated.Text as any;

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
    title: string;
    description: string;
    emoji: string;
    accentColor: string;
}

export function OnboardingSlide({ title, description, emoji, accentColor }: OnboardingSlideProps) {
    return (
        <View style={{
            width,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
        }}>
            {/* Icon circle */}
            <AnimView
                entering={FadeInDown.delay(100).springify()}
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: `${accentColor}18`,
                    borderWidth: 2,
                    borderColor: `${accentColor}30`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 36,
                }}
            >
                <Text style={{ fontSize: 56 }}>{emoji}</Text>
            </AnimView>

            {/* Title */}
            <AnimText
                entering={FadeInDown.delay(250).springify()}
                style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: COLORS.TEXT,
                    textAlign: 'center',
                    letterSpacing: -0.5,
                    marginBottom: 16,
                    lineHeight: 34,
                }}
            >
                {title}
            </AnimText>

            {/* Description */}
            <AnimText
                entering={FadeInDown.delay(400).springify()}
                style={{
                    fontSize: 16,
                    color: COLORS.TEXT_MUTED,
                    textAlign: 'center',
                    lineHeight: 24,
                }}
            >
                {description}
            </AnimText>
        </View>
    );
}
