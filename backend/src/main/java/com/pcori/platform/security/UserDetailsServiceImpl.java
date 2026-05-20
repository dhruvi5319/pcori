package com.pcori.platform.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Stub implementation — replaced in Plan 05 when UserRepository and User entity are available.
 * This stub prevents circular dependency during security configuration at startup.
 * Full implementation in Plan 05 will inject UserRepository and load user from DB.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Full implementation in Plan 05 when UserRepository is available
        // This stub prevents circular dependency during security configuration
        throw new UsernameNotFoundException("UserDetailsServiceImpl not yet fully initialized - replace in Plan 05");
    }
}
