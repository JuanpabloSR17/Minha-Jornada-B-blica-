import { AppText, ComingSoon, Screen } from '@/ui';
import { strings } from '@/i18n';

export default function FriendsTab() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppText variant="title">{strings.tabs.friends}</AppText>
      <ComingSoon title={strings.tabs.friends} body={strings.placeholders.friends} />
    </Screen>
  );
}
