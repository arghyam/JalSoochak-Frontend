import { useState, useMemo } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Flex,
  Stack,
  Text,
  Icon,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Link as ChakraLink,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { MdOutlineMoving, MdOutlinePlace, MdExpandMore, MdExpandLess } from 'react-icons/md'
import { AiOutlineEye, AiOutlineSetting, AiOutlineWarning, AiOutlineApi } from 'react-icons/ai'
import { BiKey } from 'react-icons/bi'
import { FiLogOut } from 'react-icons/fi'
import { IoLanguageOutline, IoWaterOutline } from 'react-icons/io5'
import { HiOutlineTemplate } from 'react-icons/hi'
import { BsPerson, BsListUl } from 'react-icons/bs'
import jalsoochakLogo from '@/assets/media/jalsoochak-logo.svg'
import { useAuthStore } from '@/app/store'
import { ROUTES } from '@/shared/constants/routes'
import { SIDEBAR_NAV_ITEMS } from '@/shared/constants/sidebar-nav'
import type {
  SidebarNavItem,
  SimpleNavItem,
  ExpandableNavItem,
} from '@/shared/constants/sidebar-types'

interface SidebarProps {
  onNavClick?: () => void
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  AiOutlineEye,
  AiOutlineSetting,
  AiOutlineWarning,
  AiOutlineApi,
  MdOutlinePlace,
  MdOutlineMoving,
  BiKey,
  IoLanguageOutline,
  IoWaterOutline,
  HiOutlineTemplate,
  BsPerson,
  BsListUl,
}

function isSimple(item: SidebarNavItem): item is SimpleNavItem {
  return item.type === 'simple'
}

function isExpandable(item: SidebarNavItem): item is ExpandableNavItem {
  return item.type === 'expandable'
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { t } = useTranslation('common')
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()

  const userRole = user?.role

  const visibleNavItems = useMemo(() => {
    if (!userRole) return []
    return SIDEBAR_NAV_ITEMS.filter((item) => {
      if (!item.roles.includes(userRole)) return false
      if (isExpandable(item)) {
        const visibleChildren = item.children.filter((c) => c.roles.includes(userRole))
        return visibleChildren.length > 0
      }
      return true
    })
  }, [userRole])

  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set())

  const isChildPathActive = (path: string) => {
    if (path === ROUTES.SUPER_ADMIN_OVERVIEW || path === ROUTES.STATE_ADMIN_OVERVIEW)
      return location.pathname === path
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    }
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <Box
      as="aside"
      position={{ base: 'relative', lg: 'fixed' }}
      left={0}
      top={0}
      zIndex={40}
      h="100vh"
      w="250px"
    >
      <Flex
        direction="column"
        h="100vh"
        w="250px"
        bg="white"
        borderRight="1px"
        borderColor="neutral.100"
        py={12}
      >
        {/* Brand Section */}
        <Flex
          h="84px"
          align="center"
          justify="center"
          gap={2}
          borderBottom="1px"
          borderColor="neutral.100"
          px={7}
        >
          <Image
            src={jalsoochakLogo}
            alt={t('sidebar.logoAlt', 'JalSoochak logo')}
            height="84px"
            width="168px"
          />
        </Flex>

        {/* Navigation Section */}
        <Box
          as="nav"
          role="navigation"
          aria-label={t('sidebar.mainNavigation', 'Main navigation')}
          flex={1}
          overflowY="auto"
        >
          <Stack gap={4} px={7} py={5}>
            {visibleNavItems.map((item) => {
              if (isSimple(item)) {
                const isActive = isChildPathActive(item.path)
                const ItemIcon = ICON_MAP[item.icon]

                return (
                  <ChakraLink
                    as={RouterLink}
                    key={item.path}
                    to={item.path}
                    onClick={onNavClick}
                    aria-current={isActive ? 'page' : undefined}
                    textDecoration="none"
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Flex
                      alignItems="center"
                      gap={2}
                      borderRadius="lg"
                      px={3}
                      py={2}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      bg={isActive ? 'primary.25' : 'transparent'}
                      color={isActive ? 'primary.700' : 'neutral.950'}
                      minH="44px"
                      _hover={{
                        bg: isActive ? 'primary.25' : 'neutral.100',
                      }}
                    >
                      {ItemIcon && (
                        <Icon as={ItemIcon} boxSize={5} flexShrink={0} aria-hidden="true" />
                      )}
                      <Text isTruncated>{t(item.labelKey)}</Text>
                    </Flex>
                  </ChakraLink>
                )
              }

              if (isExpandable(item)) {
                const visibleChildren = item.children.filter(
                  (c) => userRole && c.roles.includes(userRole)
                )
                const isParentActive = visibleChildren.some((c) => isChildPathActive(c.path))
                const isOpen =
                  !collapsedKeys.has(item.labelKey) &&
                  (expandedKey === item.labelKey ||
                    visibleChildren.some((c) => isChildPathActive(c.path)))
                const ItemIcon = ICON_MAP[item.icon]

                return (
                  <Box key={item.labelKey}>
                    <Flex
                      as="button"
                      type="button"
                      alignItems="center"
                      gap={2}
                      borderRadius="lg"
                      px={3}
                      py={2}
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      bg={isParentActive ? 'primary.25' : 'transparent'}
                      color={isParentActive ? 'primary.700' : 'neutral.950'}
                      minH="44px"
                      w="full"
                      textAlign="left"
                      cursor="pointer"
                      border="none"
                      aria-expanded={isOpen}
                      _hover={{
                        bg: isParentActive ? 'primary.25' : 'neutral.100',
                      }}
                      onClick={() => {
                        if (isOpen) {
                          setCollapsedKeys((prev) => new Set(prev).add(item.labelKey))
                          setExpandedKey(null)
                        } else {
                          setCollapsedKeys((prev) => {
                            const next = new Set(prev)
                            next.delete(item.labelKey)
                            return next
                          })
                          setExpandedKey(item.labelKey)
                        }
                      }}
                    >
                      {ItemIcon && (
                        <Icon as={ItemIcon} boxSize={5} flexShrink={0} aria-hidden="true" />
                      )}
                      <Text isTruncated flex={1}>
                        {t(item.labelKey)}
                      </Text>
                      <Icon
                        as={isOpen ? MdExpandLess : MdExpandMore}
                        boxSize={5}
                        flexShrink={0}
                        aria-hidden="true"
                      />
                    </Flex>
                    {isOpen && (
                      <Stack gap={1} pl={8} mt={1}>
                        {visibleChildren.map((child) => {
                          const isActive = isChildPathActive(child.path)
                          return (
                            <ChakraLink
                              as={RouterLink}
                              key={child.path}
                              to={child.path}
                              onClick={onNavClick}
                              aria-current={isActive ? 'page' : undefined}
                              textDecoration="none"
                              _hover={{ textDecoration: 'none' }}
                            >
                              <Flex
                                alignItems="center"
                                gap={2}
                                borderRadius="lg"
                                px={3}
                                py={2}
                                fontSize="sm"
                                fontWeight="medium"
                                transition="all 0.2s"
                                bg={isActive ? 'primary.25' : 'transparent'}
                                color={isActive ? 'primary.700' : 'neutral.950'}
                                minH="40px"
                                _hover={{
                                  bg: isActive ? 'primary.25' : 'neutral.100',
                                }}
                              >
                                <Text isTruncated>{t(child.labelKey)}</Text>
                              </Flex>
                            </ChakraLink>
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                )
              }

              return null
            })}
          </Stack>
        </Box>

        {/* Profile Section */}
        <Menu placement="top-start">
          <MenuButton
            w="100%"
            borderTop="1px"
            borderColor="neutral.100"
            px={7}
            py={4}
            cursor="pointer"
            _hover={{ bg: 'neutral.50' }}
          >
            <Flex align="center" gap={3}>
              <Flex
                h="40px"
                w="40px"
                flexShrink={0}
                align="center"
                justify="center"
                borderRadius="full"
                bg="primary.500"
                color="white"
              >
                <Text fontSize="sm" fontWeight="semibold">
                  {user ? getInitials(user.name) : 'U'}
                </Text>
              </Flex>
              <Flex direction="column" minW={0}>
                <Text fontSize="sm" fontWeight="medium" color="neutral.950" isTruncated>
                  {user?.name || 'User'}
                </Text>
              </Flex>
            </Flex>
          </MenuButton>
          <MenuList height="44px" px={7} py={0}>
            <MenuItem
              height="full"
              width="167px"
              px={3}
              py={0}
              gap={2}
              borderRadius={2}
              onClick={handleLogout}
              _hover={{ bg: 'neutral.100' }}
            >
              <FiLogOut />
              <Text fontSize="16px" fontWeight="500">
                {t('sidebar.logout')}
              </Text>
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  )
}
