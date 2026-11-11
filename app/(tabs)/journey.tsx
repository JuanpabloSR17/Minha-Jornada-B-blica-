import { AppText, ComingSoon, Screen } from '@/ui';
import { strings } from '@/i18n';

export default function JourneyTab() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{strings.tabs.journey}</AppText>
      <ComingSoon title={strings.tabs.journey} body={strings.placeholders.journey} />
    </Screen>
  );
}
