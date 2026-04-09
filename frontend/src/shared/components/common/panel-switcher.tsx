import { Box, Button, Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { AUTH_ROLES } from '@/shared/constants/auth'
import { ROUTES } from '@/shared/constants/routes'
import { isSingleTenantMode } from '@/config/server-config'
import { HiChevronDown } from 'react-icons/hi'

export function PanelSwitcher() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Check if env var is set to "single_tenant_mode"
  const isSingleTenant = isSingleTenantMode()

  // Check if user has SUPER_STATE_ADMIN role
  const isEligible = user?.role === AUTH_ROLES.SUPER_STATE_ADMIN

  // Only render if both conditions are met
  if (!isSingleTenant || !isEligible) {
    return null
  }

  // Determine current active panel
  const pathname = location.pathname
  const isStateAdminPanel = pathname.startsWith(ROUTES.STATE_ADMIN)
  const isSuperAdminPanel = pathname.startsWith(ROUTES.SUPER_ADMIN)
  const currentPanel = isStateAdminPanel ? 'state-admin' : isSuperAdminPanel ? 'super-user' : null

  if (!currentPanel) {
    return null
  }

  return (
    <Box position="relative" zIndex={1}>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<HiChevronDown size={16} />}
          variant="ghost"
          size="sm"
          fontSize="sm"
          fontWeight="500"
          px={3}
          py={2}
          minW="auto"
          height="auto"
          aria-label="Switch panel"
          bg="transparent"
          borderColor="neutral.200"
          borderWidth="1px"
          color="neutral.700"
          _hover={{
            bg: 'neutral.50',
            borderColor: 'neutral.300',
          }}
          _active={{
            bg: 'neutral.100',
          }}
        >
          {currentPanel === 'super-user' ? 'Super User' : 'State Admin'}
        </MenuButton>
        <MenuList minW="160px" py={1} borderRadius="8px" boxShadow="md" borderColor="neutral.200">
          <MenuItem
            onClick={() => navigate(ROUTES.SUPER_ADMIN)}
            bg={isSuperAdminPanel ? 'primary.25' : 'transparent'}
            color={isSuperAdminPanel ? 'primary.600' : 'neutral.700'}
            _hover={{ bg: isSuperAdminPanel ? 'primary.50' : 'neutral.50' }}
            fontSize="14px"
            py={2}
          >
            Super User
          </MenuItem>
          <MenuItem
            onClick={() => navigate(ROUTES.STATE_ADMIN)}
            bg={isStateAdminPanel ? 'primary.25' : 'transparent'}
            color={isStateAdminPanel ? 'primary.600' : 'neutral.700'}
            _hover={{ bg: isStateAdminPanel ? 'primary.50' : 'neutral.50' }}
            fontSize="14px"
            py={2}
          >
            State Admin
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  )
}
