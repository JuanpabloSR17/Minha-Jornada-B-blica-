import { AppText, ComingSoon, Screen } from '@/ui';
import { strings } from '@/i18n';

export default function ReadTab() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{strings.tabs.read}</AppText>
      <ComingSoon title={strings.tabs.read} body={strings.placeholders.read} />
    </Screen>
  );
}
