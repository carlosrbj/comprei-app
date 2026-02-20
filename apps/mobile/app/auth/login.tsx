import { View, Text, TextInput, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuthStore();

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (e) {
            Alert.alert('Erro', 'Verifique suas credenciais e tente novamente.');
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
                {/* Logo area */}
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
                        <Ionicons name="receipt" size={30} color="#FFFFFF" />
                    </View>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 }}>
                        Comprei
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginTop: 4 }}>
                        Controle seus gastos com inteligência
                    </Text>
                </View>

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
                        marginBottom: 24,
                    }}
                    placeholder="••••••"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Login button */}
                <TouchableOpacity
                    onPress={handleLogin}
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
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Text>
                </TouchableOpacity>

                {/* Register link */}
                <Link href="./register" asChild>
                    <TouchableOpacity style={{ alignItems: 'center' }}>
                        <Text style={{ color: COLORS.PRIMARY, fontWeight: '600', fontSize: 14 }}>
                            Não tem conta? Cadastre-se
                        </Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </KeyboardAvoidingView>
    );
}
