import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useState, useEffect } from 'react';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuthStore();
    const router = useRouter();
    const params = useLocalSearchParams<{ ref?: string }>();

    // Auto-fill referral code from deep link or search param
    useEffect(() => {
        if (params.ref) {
            setReferralCode(params.ref.toUpperCase());
        }
    }, [params.ref]);

    const handleRegister = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await signUp(email, password, name, referralCode.trim().toUpperCase() || undefined);
            Alert.alert('Sucesso', 'Conta criada! Faça login para continuar.', [
                { text: 'OK', onPress: () => router.replace('/auth/login') }
            ]);
        } catch (e) {
            Alert.alert('Erro no cadastro', 'Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

            <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 48 }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 20,
                        backgroundColor: COLORS.PRIMARY,
                        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                        shadowColor: COLORS.PRIMARY,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 6,
                    }}>
                        <Ionicons name="person-add" size={28} color="#FFFFFF" />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 }}>
                        Crie sua Conta
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginTop: 4 }}>
                        Comece a controlar seus gastos hoje
                    </Text>
                </View>

                {/* Name */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT, marginBottom: 8 }}>Nome</Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.SURFACE,
                        borderWidth: 1,
                        borderColor: COLORS.BORDER,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: COLORS.TEXT,
                        marginBottom: 16,
                    }}
                    placeholder="Seu nome"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={name}
                    onChangeText={setName}
                />

                {/* Email */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT, marginBottom: 8 }}>Email</Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.SURFACE,
                        borderWidth: 1,
                        borderColor: COLORS.BORDER,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: COLORS.TEXT,
                        marginBottom: 16,
                    }}
                    placeholder="ex: carlos@example.com"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                {/* Password */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT, marginBottom: 8 }}>Senha</Text>
                <TextInput
                    style={{
                        backgroundColor: COLORS.SURFACE,
                        borderWidth: 1,
                        borderColor: COLORS.BORDER,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: COLORS.TEXT,
                        marginBottom: 16,
                    }}
                    placeholder="••••••"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Referral Code (optional) */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.TEXT, marginBottom: 8 }}>
                    Código de indicação{' '}
                    <Text style={{ fontWeight: '400', color: COLORS.TEXT_MUTED }}>(opcional)</Text>
                </Text>
                <TextInput
                    style={{
                        backgroundColor: referralCode ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
                        borderWidth: 1,
                        borderColor: referralCode ? COLORS.PRIMARY : COLORS.BORDER,
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: COLORS.TEXT,
                        marginBottom: 24,
                        letterSpacing: referralCode ? 4 : 0,
                    }}
                    placeholder="Ex: ABC123"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={referralCode}
                    onChangeText={(v) => setReferralCode(v.toUpperCase())}
                    autoCapitalize="characters"
                    maxLength={6}
                />

                {/* Register button */}
                <TouchableOpacity
                    onPress={handleRegister}
                    disabled={loading}
                    style={{
                        backgroundColor: COLORS.PRIMARY,
                        padding: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                        marginBottom: 20,
                        opacity: loading ? 0.7 : 1,
                        shadowColor: COLORS.PRIMARY,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                    }}
                >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                        {loading ? 'Criando conta...' : 'Cadastrar'}
                    </Text>
                </TouchableOpacity>

                {/* Login link */}
                <Link href="./login" asChild>
                    <TouchableOpacity style={{ alignItems: 'center' }}>
                        <Text style={{ color: COLORS.PRIMARY, fontWeight: '600', fontSize: 14 }}>
                            Já tem conta? Faça Login
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}
