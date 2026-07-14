import { ContentBrowse } from '@/components/content/ContentBrowse'

export default function CurrentAffairsPage() {
  return (
    <ContentBrowse
      title="Current Affairs"
      description="Framework-first briefs that teach you how to follow and analyse recurring exam themes."
      categories={['Current Affairs']}
      topicPills={['Monetary Policy', 'Budget', 'Summits', 'Space', 'Defence', 'Schemes', 'Elections']}
    />
  )
}
