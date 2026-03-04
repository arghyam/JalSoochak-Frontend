import { Box, Text, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'
import { StatusChip } from '@/shared/components/common'
import type { EntityPerformance } from '../../types'

const STATUS_LABELS: Record<EntityPerformance['status'], string> = {
  good: 'Good',
  'needs-attention': 'Needs Attention',
  critical: 'Critical',
}

interface PerformanceTableProps {
  data: EntityPerformance[]
  title: string
  isBest?: boolean
  className?: string
}

export function PerformanceTable({ data, title }: PerformanceTableProps) {
  return (
    <Box>
      <Text fontSize="lg" fontWeight="semibold" mb={4}>
        {title}
      </Text>
      <Box borderRadius="lg" borderWidth="1px" borderColor="neutral.100" overflow="hidden">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Entity</Th>
              <Th>Coverage %</Th>
              <Th>Regularity %</Th>
              <Th>Continuity</Th>
              <Th>Quantity (LPCD)</Th>
              <Th>Composite Score</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((entity) => (
              <Tr key={entity.name}>
                <Td>
                  <Text fontWeight="medium">{entity.name}</Text>
                </Td>
                <Td>{entity.coverage.toFixed(1)}%</Td>
                <Td>{entity.regularity.toFixed(1)}%</Td>
                <Td>{entity.continuity.toFixed(1)}</Td>
                <Td>{entity.quantity}</Td>
                <Td>
                  <Text fontWeight="semibold">{entity.compositeScore.toFixed(2)}</Text>
                </Td>
                <Td>
                  <StatusChip status={entity.status} label={STATUS_LABELS[entity.status]} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
