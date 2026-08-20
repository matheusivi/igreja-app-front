import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, MenorahMark } from '../../components';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, eyebrow, children, footer }: AuthLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-gutter"
          contentContainerClassName="items-center gap-xl py-3xl"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-3">
            <MenorahMark />
            {eyebrow ? (
              <Text className="font-sans-semibold text-xs uppercase tracking-wide text-ink-muted">
                {eyebrow}
              </Text>
            ) : null}
            <Text className="font-serif-bold text-2xl text-ink">{title}</Text>
            {subtitle ? (
              <Text className="max-w-[280px] text-center font-sans text-sm leading-5 text-ink-muted">
                {subtitle}
              </Text>
            ) : null}
          </View>

          <Card accent className="w-full" contentClassName="gap-4">
            {children}
          </Card>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
