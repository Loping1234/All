import { Card } from '@/components/common/ui'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">About PrepMode</h1>
      <p className="mt-4 leading-relaxed text-gray-600">
        PrepMode is a focused study workspace for the language and awareness sections of India's competitive
        exams. It covers English, Vocabulary, GK, Static GK, Current Affairs, Editorials, Quizzes, Revision, and
        Progress — and deliberately nothing else.
      </p>

      <div className="mt-10 space-y-5">
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900">What we believe</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Serious preparation needs depth in a few things, not shallow coverage of everything. PrepMode keeps
            scope narrow so that every screen helps you read better, recall faster, and revise smarter.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900">Our content policy</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            PrepMode is not an aggregator. Sources are inputs that inform our editorial team; everything learners
            see is original educational output, written for exams and reviewed by a human before it is published.
            We never republish third-party articles.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900">What we measure</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Two honest signals: what you have completed and how accurately you answer practice questions. No
            invented scores, no vanity metrics.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900">Who it is for</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Aspirants preparing for CAT, UPSC, SSC, Banking, CLAT, CUET, MBA entrances, and Defence Exams — anyone
            whose exam rewards strong English and sharp awareness.
          </p>
        </Card>
      </div>
    </div>
  )
}
