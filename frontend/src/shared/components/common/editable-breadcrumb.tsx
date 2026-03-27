import React from 'react'
import { Flex, Text, Button } from '@chakra-ui/react'

interface EditableBreadcrumbProps {
  isEditing: boolean
  onCancel: () => void
  viewLabel: string
  editLabel: string
}

export function EditableBreadcrumb({
  isEditing,
  onCancel,
  viewLabel,
  editLabel,
}: EditableBreadcrumbProps) {
  if (!isEditing) return null

  return (
    <Flex as="nav" aria-label="Breadcrumb" gap={2} flexWrap="wrap">
      <Button
        variant="link"
        fontSize="14px"
        lineHeight="21px"
        color="neutral.500"
        fontWeight="normal"
        _hover={{ textDecoration: 'underline' }}
        onClick={onCancel}
      >
        {viewLabel}
      </Button>
      <Text fontSize="14px" lineHeight="21px" color="neutral.500" aria-hidden="true">
        /
      </Text>
      <Text fontSize="14px" lineHeight="21px" color="#26272B" aria-current="page">
        {editLabel}
      </Text>
    </Flex>
  )
}
